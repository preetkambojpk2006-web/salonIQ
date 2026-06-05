import { AiAdvisor } from "@/components/command-center/today/ai-advisor";
import { BookingSources } from "@/components/command-center/today/booking-sources";
import { DemoStory } from "@/components/command-center/today/demo-story";
import { NextAppointments } from "@/components/command-center/today/next-appointments";
import { OsHero } from "@/components/command-center/today/os-hero";
import { PremiumStrip } from "@/components/command-center/today/premium-strip";
import { SummaryGrid } from "@/components/command-center/today/summary-grid";
import type {
  LiveFlowItem,
  TodayMetrics,
  UpcomingAppointment,
} from "@/lib/dashboard/today-queries";

type TodayViewProps = {
  metrics: TodayMetrics;
  upcoming: UpcomingAppointment[];
  liveFlow: LiveFlowItem[];
};

export function TodayView({ metrics, upcoming, liveFlow }: TodayViewProps) {
  return (
    <div className="view-stack">
      <OsHero liveFlow={liveFlow} />
      <SummaryGrid metrics={metrics} />

      <div className="two-column">
        <NextAppointments appointments={upcoming} />
        <AiAdvisor />
      </div>

      <PremiumStrip />
      <DemoStory />
      <BookingSources />
    </div>
  );
}
