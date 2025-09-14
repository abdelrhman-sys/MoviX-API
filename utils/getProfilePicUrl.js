import supabase from "./supabaseClient.js";

export default async function getImgUrl(path) {
    console.log(path);
    
    const {data, error} = await supabase.storage.from("Profile images").createSignedUrl(path, 60 * 60 * 2);

    if (error) {
        console.error(error);
        return null;
    } else {
        return data.signedUrl;
    }
}