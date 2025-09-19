//                                Using Promises

const asyncHandler = (requestHandler) => { 
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }

}
    
    
    export {asyncHandler}





//https://youtu.be/S5EpsMjel-M?si=UE74siI9WjLEY8wE  time:27 min for the below code ,
//  if not understood why (fn) => (this is for running higher order fn) => {} 

/*               Using try and catch

    // const asyncHandler = (fn) => {() => {}}  same as below
    const asyncHandler = (fn) => async (req, res, next) => {
        try {
            await fn(req, res, next)
        } catch (error) {
            res.status(error.code || 500).json({
                success: false,
                message: error.message
            })  
        }
    }
    
    export {asyncHandler}
    */