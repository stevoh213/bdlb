import { Session, Climb } from "@/types/climbing";

export const exportToCSV = (sessions: Session[]) => {
  // Flatten all data into rows for CSV
  const rows: string[][] = [];

  // Add header row
  rows.push([
    "Session ID",
    "Session Date",
    "Session Start Time",
    "Session End Time",
    "Session Duration (min)",
    "Location",
    "Climbing Type",
    "Session Notes",
    "Climb ID",
    "Climb Name",
    "Grade",
    "Tick Type",
    "Height (ft)",
    "Time on Wall (min)",
    "Effort (1-10)",
    "Climb Notes",
    "Climb Time",
  ]);

  sessions.forEach((session) => {
    const sessionDuration = session.endTime
      ? Math.floor(
          (session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60,
        )
      : 0;

    if (session.climbs.length === 0) {
      // Session with no climbs
      rows.push([
        session.id,
        session.startTime.toLocaleDateString(),
        session.startTime.toLocaleTimeString(),
        session.endTime?.toLocaleTimeString() || "Active",
        sessionDuration.toString(),
        session.location,
        session.climbingType,
        session.notes || "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
    } else {
      // Session with climbs
      session.climbs.forEach((climb) => {
        rows.push([
          session.id,
          session.startTime.toLocaleDateString(),
          session.startTime.toLocaleTimeString(),
          session.endTime?.toLocaleTimeString() || "Active",
          sessionDuration.toString(),
          session.location,
          session.climbingType,
          session.notes || "",
          climb.id,
          climb.name,
          climb.grade,
          climb.tickType,
          climb.height?.toString() || "",
          climb.timeOnWall?.toString() || "",
          climb.effort.toString(),
          climb.notes || "",
          climb.timestamp.toLocaleTimeString(),
        ]);
      });
    }
  });

  // Convert to CSV string
  const csvContent = rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `climbing-log-${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
