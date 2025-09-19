import multer from "multer";

/*
The memory storage engine stores the files in memory as
 Buffer objects. It doesn’t have any options.

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
*/

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        //cb = call back
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

export const upload = multer({
    //  storage: storage (is same as storage: storage due to  use of ES6 syntax)
    storage,
});
