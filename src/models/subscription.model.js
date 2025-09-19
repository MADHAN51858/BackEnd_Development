import mongoose, { Schema }  from "mongoose";

const subscriptionSchema = new Schema({
        subscriber: {    //subscriber is used to find which all channels the user is subscribed to 
            type: Schema.Types.ObjectId,  //one who is subscribing
            ref: "User"
        },
        channel:  {    //channel is used to the number of subcribers a user has
            //if you don't get it watch this video:- (timestamp from 16 minutes) https://youtu.be/4_Ge2QEcT8k?si=C78ZaRIfRTcFWqPC
            type: Schema.Types.ObjectId,  //one to whom "subscriber" is subscribing
            ref: "User"
        },
    },
    {
        timestamps:true
    })

export const Subscription = mongoose.model("Subscription", subscriptionSchema)