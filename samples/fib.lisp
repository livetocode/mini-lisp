(defun fib(n) 
    (if (< n 2) 
        n 
        (+ (fib (- n 1)) 
           (fib (- n 2))
        )
    )
)

(defun repeat(n f) 
    (if (= n 0) 
        nil 
        (cons (funcall f n) 
              (repeat (- n 1) f))
    )
)

(repeat 5 #'fib)
