export interface ProjectDocument {
  id: string;
  ownerId: string;
  title: string;
  status: 'draft' | 'completed';
  lastModified: {
    seconds: number;
    nanoseconds: number;
    toDate: () => Date;
    toMillis: () => number;
  };
  data: any;
}

export interface VersionDocument {
  id: string;
  timestamp: {
    toDate: () => Date;
  };
  label: string;
  phase: string;
  snapshotData: any;
}
