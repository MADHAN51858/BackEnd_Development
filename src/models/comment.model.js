import mongoose from "mongoose";

const commentschema = new Schema(
    {
        content: {
            type: String,
            required: true,
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

commentschema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment", commentschema);
