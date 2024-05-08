import axios from "axios";

export async function executeTask(fileName: string, serverIp: string) {
  const form = new FormData();
  form.append("filename", fileName);
  try {
    const res = await axios.post(`http://${serverIp}/api/schedule-play`, form, {
      headers: {
        "Content-Type": "form-data",
      },
    });
    if (res.status === 200) {
      console.log(`Executing task: ${fileName} at ${new Date()}`);
    }
  } catch (error) {
    console.log("Something went wrong While Executing Schedule", fileName);
  }
  // Your task execution logic here
}
