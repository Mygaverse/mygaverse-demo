export type AnnouncementType = 'update' | 'changelog' | 'alert';
export type AnnouncementStatus = 'published' | 'archived' | 'draft';

export interface Announcement {
    id: string;
    title: string;
    content: string;
    type: AnnouncementType;
    status: AnnouncementStatus;
    createdAt: any; // Firestore Timestamp or string
    createdBy: string;
    authorName?: string;
}
