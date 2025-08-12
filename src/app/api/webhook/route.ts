import { NextRequest } from "next/server";
import {
  deleteUserNotificationDetails,
  setUserNotificationDetails,
} from "~/lib/mongo";
import { sendFrameNotification } from "~/lib/notifs";

export async function POST(request: NextRequest) {
  try {
    const requestJson = await request.json();
    
    // Basic webhook validation - you may want to add proper signature verification
    if (!requestJson.fid || !requestJson.event) {
      return Response.json(
        { success: false, error: "Invalid webhook data" },
        { status: 400 }
      );
    }

    const fid = requestJson.fid;
    const event = requestJson.event;

    // Handle different webhook events
    switch (event.event) {
      case "frame_added":
        if (event.notificationDetails) {
          await setUserNotificationDetails(fid, event.notificationDetails);
          await sendFrameNotification({
            fid,
            title: "Welcome to Moviemeter",
            body: "Your movie rating frame is now ready!",
          });
        } else {
          await deleteUserNotificationDetails(fid);
        }
        break;
      
      case "frame_removed":
        await deleteUserNotificationDetails(fid);
        break;
      
      case "notifications_enabled":
        if (event.notificationDetails) {
          await setUserNotificationDetails(fid, event.notificationDetails);
          await sendFrameNotification({
            fid,
            title: "Notifications Enabled",
            body: "You'll now receive updates about your movie ratings!",
          });
        }
        break;

      case "notifications_disabled":
        await deleteUserNotificationDetails(fid);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
