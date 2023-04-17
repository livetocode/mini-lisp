import { ArrayCardinality, z, ZodTypeAny } from "zod";
import { BuiltinFunction, BuiltinFunctionCallback, Cons, Expr, ExprType, FloatAtom, FunctionArgDefinition, FunctionEvaluationContext, FunctionMetadata, IntegerAtom, StringAtom, SymbolAtom } from "./types";

export const zExpr = z.custom<Expr>(
    (data) => data instanceof Expr
).describe('expr');

export const zNil = z.custom<Expr>(
    (data) => data instanceof Expr && data.isNil()
).describe('nil');


export const zAtom = z.custom<Expr>(
    (data) => data instanceof Expr && data.isAtom()
).describe('atom');

export const zCons = z.instanceof(Cons).describe('cons');

export const zList = z.union([zCons, zNil]).describe('list');

export const zNumber = z.custom<Expr>(
    (data) => data instanceof Expr && data.isNumber()
).describe('number');

export const zInteger = z.instanceof(IntegerAtom).describe('integer');

export const zFloat = z.instanceof(FloatAtom).describe('float');

export const zText = z.custom<Expr>(
    (data) => data instanceof Expr && data.isText()
).describe('text');

export const zSymbol = z.instanceof(SymbolAtom).describe('symbol');

export const zString = z.instanceof(StringAtom).describe('string');

export type Args<T extends [ZodTypeAny, ...ZodTypeAny[]] | [] = [ZodTypeAny, ...ZodTypeAny[]], TT extends ZodTypeAny = ZodTypeAny, Cardinality extends ArrayCardinality = "many"> = z.ZodTuple<T> | z.ZodArray<TT, Cardinality>;

export type ZBuiltinFunctionCallback<TArgs extends Args, TResult extends z.ZodTypeAny>  = 
    (ctx: FunctionEvaluationContext, args: z.infer<TArgs>) => z.infer<TResult>;

export type FunctionMetadataWithoutArgsAndResult = Omit<FunctionMetadata, "args" | "returnType">;

export interface ZFunctionMetadata<TArgs extends Args, TResult extends z.ZodTypeAny> extends FunctionMetadataWithoutArgsAndResult {
    args: TArgs;
    returnType: TResult;
}

function convertZodTypeToMetaArg<TType extends z.ZodTypeAny>(type: TType): ExprType {
    return new ExprType(type.description ?? '?');
}

export function convertZodArgToMetaArg<TArg extends z.ZodTypeAny>(arg: TArg, idx: number): FunctionArgDefinition {
    return {
        name: `arg${idx}`,
        type: convertZodTypeToMetaArg(arg),
    };
}

function convertZodArgsToMetaArgs<TArgs extends Args>(args: TArgs): FunctionArgDefinition[] {
    return [];
    // return args.items.map(convertZodArgToMetaArg);
}

export class ZBuiltinFunction<TArgs extends Args, TResult extends z.ZodTypeAny> extends BuiltinFunction {
    constructor(meta: ZFunctionMetadata<TArgs, TResult>, callback: ZBuiltinFunctionCallback<TArgs, TResult>) {
        const adaptedMeta: FunctionMetadata = {
            name: meta.name,
            evalArgs: meta.evalArgs,
            args: convertZodArgsToMetaArgs(meta.args),
            returnType: convertZodTypeToMetaArg(meta.returnType),
        }
        const adapter: BuiltinFunctionCallback = ctx => this.adaptCallback(ctx, meta, callback);
        super(adaptedMeta, adapter);
    }

    protected adaptCallback(
        ctx: FunctionEvaluationContext, 
        meta: ZFunctionMetadata<TArgs, TResult>,
        callback: ZBuiltinFunctionCallback<TArgs, TResult>): Expr {
            const args = meta.args.parse(ctx.args);
            const res: any = callback(ctx, args);
            return meta.returnType.parse(res);
    }
}
