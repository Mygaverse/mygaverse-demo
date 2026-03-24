const DOMAIN = (process.env.NEXT_PUBLIC_LEARNWORLD_DOMAIN || 'bqool.learnworlds.com').replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
const CLIENT_ID = (process.env.NEXT_PUBLIC_LEARNWORLD_CLIENT_ID || '').trim();
const CLIENT_SECRET = (process.env.NEXT_PUBLIC_LEARNWORLD_CLIENT_SECRET || '').trim();
const STATIC_ACCESS_TOKEN = (process.env.NEXT_PUBLIC_LEARNWORLD_ACCESS_TOKEN || '').trim();
const SSO_SECRET = (process.env.NEXT_PUBLIC_LEARNWORLD_SSO_SECRET || '').trim();

export interface Course {
    id: string;
    title: string;
    description: string;
    image: string;
    author: string;
    duration: string;
    lessons_count: number;
    /** Raw tag strings from LearnWorlds admin */
    tags: string[];
    /** Category display names from LearnWorlds admin */
    categories: string[];
}

export class LearnWorldClient {
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    /**
     * Get a valid access token using Client Credentials flow or Static Token.
     */
    private async getAccessToken(): Promise<string> {
        // 1. Use Static Token if provided (Override)
        if (STATIC_ACCESS_TOKEN) {
            return STATIC_ACCESS_TOKEN;
        }

        // 2. Use Cached Token
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        if (!CLIENT_ID || !CLIENT_SECRET) {
            throw new Error('LearnWorld credentials not configured.');
        }

        console.log('[LearnWorld] Fetching new access token...');

        try {
            const response = await fetch(`https://${DOMAIN}/admin/api/oauth2/access_token`, {
                method: 'POST',
                headers: {
                    'Lw-Client': CLIENT_ID,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    data: JSON.stringify({
                        'client_id': CLIENT_ID,
                        'client_secret': CLIENT_SECRET,
                        'grant_type': 'client_credentials'
                    })
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch token: ${response.status} ${errorText}`);
            }

            const data = await response.json();

            // Debug: Log the token response
            console.log('[LearnWorld] Token Response:', data);

            // Handle nested tokenData structure
            const tokenData = data.tokenData || data;

            if (!tokenData.access_token) {
                throw new Error('No access_token in response: ' + JSON.stringify(tokenData));
            }

            this.accessToken = tokenData.access_token;
            // Set expiry a bit earlier than actual (expires_in is usually in seconds)
            this.tokenExpiry = Date.now() + ((tokenData.expires_in || 3600) * 1000) - 60000;

            return this.accessToken as string;
        } catch (error) {
            console.error('[LearnWorld] Token Error:', error);
            throw error;
        }
    }

    /**
     * Fetch all courses from real API.
     */
    async getCourses(): Promise<Course[]> {
        try {
            const token = await this.getAccessToken();
            const response = await fetch(`https://${DOMAIN}/admin/api/v2/courses`, {
                headers: {
                    'Lw-Client': CLIENT_ID,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('[LearnWorld] Failed to fetch courses.', response.status);
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const items = Array.isArray(data) ? data : (data.data || []);

            console.log(`[LearnWorld] Successfully fetched ${items.length} courses.`);

            return items.map((c: any) => ({
                id: c.id,
                title: c.title,
                description: c.description || 'No description provided.',
                image: c.courseImage || 'https://placehold.co/800x450?text=No+Image',
                author: c.author?.name || 'BQool Academy',
                duration: 'N/A',
                lessons_count: 0,
                tags: Array.isArray(c.tags) ? c.tags : [],
                categories: Array.isArray(c.categories)
                    ? c.categories.map((cat: { id: string; title: string } | string) =>
                        typeof cat === 'string' ? cat : (cat.title || cat.id))
                    : [],
            }));

        } catch (error) {
            console.error('[LearnWorld] GetCourses Error:', error);
            console.warn('[LearnWorld] Using hardcoded fallback for Demo.');

            // Hardcoded fallback to ensure the "Getting Started" page always works for the demo
            return [
                {
                    id: 'bqool-beginner-repricing-course',
                    title: 'BQool Beginner Repricing Course',
                    description: 'Learn the basics of repricing with BQool.',
                    image: 'https://placehold.co/800x450?text=Beginner+Course',
                    author: 'BQool Academy',
                    duration: '45m',
                    lessons_count: 12,
                    tags: ['beginner'],
                    categories: ['Getting Started'],
                },
                {
                    id: 'advanced-strategy-masterclass',
                    title: 'Advanced Strategy Masterclass',
                    description: 'Take your repricing to the next level.',
                    image: 'https://placehold.co/800x450?text=Advanced+Course',
                    author: 'BQool Academy',
                    duration: '1h 20m',
                    lessons_count: 8,
                    tags: ['advanced'],
                    categories: ['Getting Started'],
                }
            ];
        }
    }

    /**
     * Fetch details for a single course.
     */
    async getCourse(courseId: string): Promise<Course | undefined> {
        const courses = await this.getCourses();
        return courses.find((c: Course) => c.id === courseId);
    }

    /**
     * Fetch course contents (sections and activities).
     */
    async getCourseContents(courseId: string) {
        try {
            const token = await this.getAccessToken();
            let effectiveId = courseId;
            if (courseId === 'ai-powered-bidding') {
                effectiveId = 'bqool-beginner-repricing-course';
            }

            const url = `https://${DOMAIN}/admin/api/v2/courses/${effectiveId}/contents`;
            const response = await fetch(url, {
                headers: {
                    'Lw-Client': CLIENT_ID,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errText = await response.text();
                return { error: `API Error ${response.status}`, details: errText };
            }

            return await response.json();
        } catch (error) {
            console.error('[LearnWorld] GetCourseContents Error:', error);
            return { error: 'Network/Code Error', details: error instanceof Error ? error.message : String(error) };
        }
    }

    /**
     * Fetch details for a specific learning unit (video URL, etc).
     */
    async getLearningUnit(courseId: string, unitId: string) {
        try {
            const token = await this.getAccessToken();
            const url = `https://${DOMAIN}/admin/api/v2/courses/${courseId}/units/${unitId}`;
            const response = await fetch(url, {
                headers: {
                    'Lw-Client': CLIENT_ID,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('[LearnWorld] GetLearningUnit Error:', error);
            return null;
        }
    }

    /**
     * Generate SSO URL via API.
     */
    async generateSSOUrl(userEmail: string, userId: string, username: string = 'User', avatar: string = '', redirectPath?: string, targetUnitId?: string): Promise<string> {
        const token = await this.getAccessToken();
        const baseUrl = `https://${DOMAIN}/admin/api/sso`;

        let finalRedirectUrl = redirectPath ? `https://${DOMAIN}${redirectPath}` : `https://${DOMAIN}`;
        if (targetUnitId) {
            const separator = finalRedirectUrl.includes('?') ? '&' : '?';
            finalRedirectUrl += `${separator}unit=${targetUnitId}`;
        }

        const bodyData = JSON.stringify({
            email: userEmail,
            // user_id: userId, // Previously requested to be removed for demo compatibility
            username: username,
            avatar: avatar,
            redirectUrl: finalRedirectUrl
        });

        console.log('[LearnWorld] Generating SSO URL for email:', userEmail);
        console.log('[LearnWorld] Target Redirect URL:', finalRedirectUrl);

        try {
            const response = await fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Lw-Client': CLIENT_ID,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    data: bodyData
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[LearnWorld] SSO API Error Status:', response.status);
                console.error('[LearnWorld] SSO API Error Body:', errorText);
                throw new Error(`SSO API Error: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            if (data.success && data.url) {
                console.log('[LearnWorld] SSO URL generated successfully.');
                return data.url;
            } else {
                console.error('[LearnWorld] SSO Response Error:', data);
                throw new Error('SSO Response invalid: ' + JSON.stringify(data));
            }
        } catch (error) {
            console.error('[LearnWorld] SSO Exception:', error);
            throw error;
        }
    }
}

export const learnWorldClient = new LearnWorldClient();
