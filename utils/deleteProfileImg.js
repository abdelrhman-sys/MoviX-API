import supabase from "./supabaseClient.js";

export default async function deleteProfileImg(path) {
  const { data, error } = await supabase
    .storage
    .from("Profile images")
    .remove([path]); // array of file paths

  if (error) {
    console.error("Error deleting image:", error.message);
    return null;
  } else {
    console.log("Image deleted successfully:", data);
    return true;
  }
}
