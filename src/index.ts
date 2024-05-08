import fs from "fs";
import wav from "wav";
import multer from "multer";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import schedule, { scheduleJob } from "node-schedule";
import { db } from "./db";
import {
  ScheduleCancleValidator,
  scheduleValidator,
} from "./validator/scheduleValidator";
import axios from "axios";
import cors from "cors";
import { executeTask } from "./functions/ScheduleTask";
const app = express();
app.use(
  cors({
    origin: "*",
  })
);
app.use(bodyParser.json());
const PORT = process.env.PORT || 8600;
const upload = multer({ dest: "uploads/" });

// Endpoint to add a task
app.post("/api/add-task", async (req: Request, res: Response) => {
  /**
   * @params {fileId} // which file you want to play, give me id and i will fetch it!
   * @params {name} // name that is unique that i can play with and deplay or delete it
   * @params {time} //when to play the audio
   */
  try {
    const { fileId, ScheduleName, time, serverIp } = scheduleValidator.parse(
      req.body
    );
    const taskTime = new Date(time);
    console.log("Setting Schedule at: ", taskTime);
    const file = await db.file.findFirst({
      where: {
        id: fileId,
        status: "UPLOADED",
      },
    });
    const scheduleExists = await db.schedule.count({
      where: {
        ScheduleName: ScheduleName,
      },
    });
    if (scheduleExists) {
      return res.status(404).json({ message: "Schedule already exists" });
    }
    if (!file || !file.id) {
      return res
        .status(404)
        .json({ message: "File not found, Please check file is valid" });
    }

    const newJob = new schedule.Job(
      ScheduleName,
      async () => await executeTask(ScheduleName, serverIp)
    );
    newJob.runOnDate(taskTime);
    await db.schedule.create({
      data: {
        fileId: file.id,
        ScheduleName,
        status: "PENDING",
        time: taskTime,
      },
    });
    // another way
    //   const job = schedule.scheduleJob(delayedDate, function () {
    //     executeTask(description);
    //   });
    console.log(`Task ${ScheduleName} Scheduled at ${taskTime}`);
    return res.status(200).json({ message: "Task scheduled successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
});

app.post("api/cancel-schedule", async (req: Request, res: Response) => {
  try {
    const { scheduleId } = ScheduleCancleValidator.parse(req.body);
    const getSchedule = await db.schedule.findFirst({
      where: {
        id: scheduleId,
      },
    });
    if (!getSchedule) {
      return res.status(400).json({ message: "Schedule not found!" });
    }
    if (getSchedule.status === "EXCECUTED") {
      return res.status(400).json({ message: "Schedule already executed!" });
    }
    if (getSchedule.status === "CANCELED") {
      return res.status(400).json({ message: "Schedule already Canceled!" });
    }
    const data = schedule.cancelJob(getSchedule.ScheduleName);
    if (!data) {
      return res.status(400).json({ message: "Failed to cancel Schedule!" });
    }
    const canceledSchedule = await db.schedule.update({
      where: {
        id: getSchedule.id,
      },
      data: {
        status: "CANCELED",
      },
    });
    if (!canceledSchedule.id) {
      return res
        .status(400)
        .json({ message: "Failed to Update schedule data" });
    }
    return res.status(200).json({ message: "Schedule successfully canceled" });
  } catch (error) {
    console.log("Something went wrong!");
    console.log(error);
    return res
      .status(500)
      .json({ message: "Something went while canceling schedule!" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
