function errorMiddleware(error, req, res, next) {

    console.error({
        path: req.path,
        method: req.method,
        Message: error.message,
        Stack: error.Stack
    })

    return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error"
    });
    
};