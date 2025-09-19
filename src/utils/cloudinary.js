import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; //file systwm from nodejs

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudianry = async (localFilePath) => {
    try{
        if(!localFilePath ) return;
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //filke as been uploaded succesfully
        // console.log("file is uploaded on cloudinary", response.url);
        fs.unlinkSync(localFilePath);
        return response;

    }catch(error){
        fs.unlinkSync(localFilePath); //remove locally saved temporrary file from server if the upload operation failed
        return null
    }
}

// const uploadResult = await cloudinary.uploader
//     .upload(
//         "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
//         {
//             public_id: "shoes",
//         }
//     )
//     .catch((error) => {
//         console.log(error);
//     });
// console.log(uploadResult);

export { uploadOnCloudianry }
