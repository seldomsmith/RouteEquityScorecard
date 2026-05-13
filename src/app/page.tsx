import { Map } from "@/components/map/Map";

export default function Home() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 relative">
        <Map />
      </div>
      <div className="h-1/3 border-t border-slate-200 bg-white grid grid-cols-2 gap-4 p-4 overflow-hidden">
        {/* Analytical widgets will go here */}
        <div className="border rounded-xl border-slate-100 bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Equity Dissemination Matrix
        </div>
        <div className="border rounded-xl border-slate-100 bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Ridership-Equity Quadrant
        </div>
      </div>
    </div>
  );
}
