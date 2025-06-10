import { Schema, model } from "mongoose";

const ConfigSchema = new Schema({
    currency: {
        type: String,
        default: ""
    }
});

const Configs = model("configs", ConfigSchema);
export default Configs;