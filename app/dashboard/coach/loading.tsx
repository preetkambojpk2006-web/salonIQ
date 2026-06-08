import { PanelSkeleton } from "@/components/ui/page-skeletons";

export default function CoachLoading() {
  return (
    <div className="view-stack">
      <PanelSkeleton rows={4} />
    </div>
  );
}
