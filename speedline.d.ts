
interface SpeedlineOutput {
  beginning: number;
  end: number;
  speedIndex: number;
  first: number;
  complete: number;
  duration: number;
  frames: {
    getProgress(): number;
    getTimeStamp(): number;
    isProgressInterpolated(): number;
  }[]
}

interface SpeedlineOptions {
  timeOrigin?: number;
  fastMode?: boolean;
  include?: 'all' | 'speedIndex' | 'perceptualSpeedIndex';
}

interface TraceEvent {
	name: string;
	args: {
		data?: {
			url?: string
		};
	};
	tid: number;
	ts: number;
	dur: number;
}

declare function Speedline(trace: TraceEvent[], opts: SpeedlineOptions): SpeedlineOutput;

export = Speedline;

