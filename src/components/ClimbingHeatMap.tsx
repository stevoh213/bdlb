import { useMemo } from "react";
import { format, startOfYear, endOfYear, eachDayOfInterval, getDay, differenceInWeeks, startOfWeek } from "date-fns";
import { Climb } from "@/types/climbing";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ClimbingHeatMapProps {
  climbs: Climb[];
  year?: number;
}

export default function ClimbingHeatMap({ climbs, year = new Date().getFullYear() }: ClimbingHeatMapProps) {
  const data = useMemo(() => {
    // Create a map of date to climb count
    const climbsByDate = new Map<string, number>();
    
    climbs.forEach(climb => {
      const climbDate = new Date(climb.date);
      if (climbDate.getFullYear() === year) {
        const dateKey = format(climbDate, 'yyyy-MM-dd');
        climbsByDate.set(dateKey, (climbsByDate.get(dateKey) || 0) + 1);
      }
    });

    // Generate all days in the year
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    const days = eachDayOfInterval({ start: yearStart, end: yearEnd });

    // Group days by week
    const weeks: { date: Date; count: number }[][] = [];
    let currentWeek: { date: Date; count: number }[] = [];
    
    // Find the first Sunday
    let firstSunday = startOfWeek(yearStart);
    if (firstSunday < yearStart) {
      // Add empty cells for days before the year starts
      const daysBefore = getDay(yearStart);
      for (let i = 0; i < daysBefore; i++) {
        currentWeek.push({ date: new Date(0), count: -1 }); // -1 indicates empty cell
      }
    }

    days.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const count = climbsByDate.get(dateKey) || 0;
      
      currentWeek.push({ date: day, count });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // Add empty cells for days after the year ends
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(0), count: -1 });
      }
      weeks.push(currentWeek);
    }

    return { weeks, maxCount: Math.max(...Array.from(climbsByDate.values()), 1) };
  }, [climbs, year]);

  const getColor = (count: number, maxCount: number) => {
    if (count === -1) return "transparent"; // Empty cell
    if (count === 0) return "#ebedf0"; // No climbs
    
    const intensity = count / maxCount;
    if (intensity <= 0.25) return "#9be9a8";
    if (intensity <= 0.5) return "#40c463";
    if (intensity <= 0.75) return "#30a14e";
    return "#216e39";
  };

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const monthPositions = useMemo(() => {
    const positions: { month: string; position: number }[] = [];
    let lastMonth = -1;
    
    data.weeks.forEach((week, weekIndex) => {
      week.forEach(day => {
        if (day.count !== -1) {
          const month = day.date.getMonth();
          if (month !== lastMonth) {
            positions.push({ month: months[month], position: weekIndex });
            lastMonth = month;
          }
        }
      });
    });
    
    return positions;
  }, [data.weeks]);

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block">
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-2 mt-7">
            <div className="h-3 text-xs text-muted-foreground">Mon</div>
            <div className="h-3"></div>
            <div className="h-3 text-xs text-muted-foreground">Wed</div>
            <div className="h-3"></div>
            <div className="h-3 text-xs text-muted-foreground">Fri</div>
            <div className="h-3"></div>
          </div>

          {/* Heat map grid */}
          <div>
            {/* Month labels */}
            <div className="flex mb-1" style={{ height: "20px" }}>
              {monthPositions.map(({ month, position }) => (
                <div
                  key={`${month}-${position}`}
                  className="text-xs text-muted-foreground"
                  style={{
                    position: "relative",
                    left: `${position * 14}px`,
                    marginRight: position === 0 ? "0" : "-40px",
                  }}
                >
                  {month}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-1">
              <TooltipProvider>
                {data.weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((day, dayIndex) => {
                      const dateStr = day.count !== -1 ? format(day.date, 'MMM d, yyyy') : '';
                      const isToday = day.count !== -1 && format(day.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      
                      return (
                        <Tooltip key={dayIndex}>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-3 h-3 rounded-sm ${isToday ? 'ring-1 ring-slate-400' : ''}`}
                              style={{
                                backgroundColor: getColor(day.count, data.maxCount),
                                cursor: day.count !== -1 ? 'pointer' : 'default',
                              }}
                            />
                          </TooltipTrigger>
                          {day.count !== -1 && (
                            <TooltipContent>
                              <p className="font-semibold">{dateStr}</p>
                              <p>{day.count === 0 ? 'No climbs' : `${day.count} climb${day.count === 1 ? '' : 's'}`}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#ebedf0" }}></div>
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#9be9a8" }}></div>
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#40c463" }}></div>
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#30a14e" }}></div>
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#216e39" }}></div>
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}