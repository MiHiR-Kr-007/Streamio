import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    username : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true
    },
    email : {
        type : String,
        required : true,
        unique : true,
        trim : true
    },
    password : {
        type : String,
        required : [true, "Password is required."]
    },
    full_name : {
        type : String,
        required : true,
        index : true,
        trim : true
    },
    avatar : {
        type : String,
        required : true
    },
    coverImage : {
        type : String
    },
    refreshToken : {
        type : String
    },
    watchHistory : [
        {
            type : Schema.Types.ObjectId,
            ref : "Video"
        }
    ]

}, {timestamps : true});

userSchema.pre("save", async function(next){
    if(! this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 7);
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function(){
    
    return jwt.sign({
        _id : this._id,
        email : this.email,
        username : this.username,
        full_name : this.full_name
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY || "1d"
    }
)};

userSchema.methods.generateRefreshToken = function(){
    
    return jwt.sign({ 
        _id : this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY || "10d"
    }
)};


export const User = mongoose.model("User",userSchema);