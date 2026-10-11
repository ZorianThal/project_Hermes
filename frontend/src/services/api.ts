// Hermes Backend API Service
const API_BASE = '/api';

export interface DailyStreak {
  weekStart: string | null;
  claimedDays: number[];
  lastClaimDate: string | null;
  isBroken: boolean;
}

export interface DailyRewardDay {
  day: number;
  label: string;
  xp: number;
  coins: number;
  bonusText?: string;
  status: 'claimed' | 'can_claim' | 'missed' | 'upcoming';
}

export interface DailyRewardsStatus {
  weekStart: string;
  currentDay: number;
  claimedDays: number[];
  isBroken: boolean;
  canClaimToday: boolean;
  todayReward: { day: number; label: string; xp: number; coins: number; bonusText?: string } | null;
  days: DailyRewardDay[];
}

export type PetType = 'cat' | 'owl' | 'snake' | 'spider';
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface PetEquipped {
  color?: string;
  head?: string | null;
  body?: string | null;
  limbs?: string | null;
  hat?: string | null;
  outfit?: string | null;
  boots?: string | null;
}

export interface PetData {
  name: string;
  type?: string;
  petType?: PetType | null;
  hunger: number;
  happiness: number;
  energy: number;
  level: number;
  xp: number;
  lastFedAt?: number;
  lastFreeFedAt?: number;
  equipped: PetEquipped;
  inventory: string[];
}

export interface User {
  id: number;
  username: string;
  role: 'student' | 'teacher' | 'admin';
  fullName: string;
  groupId: number | null;
  xp: number;
  level: number;
  coins?: number;
  bio?: string;
  avatarUrl?: string | null;
  avatarColor?: string;
  unlockedColors?: string[];
  dailyStreak?: DailyStreak;
  pet?: PetData | null;
  createdAt: number;
}

export interface Group {
  id: number;
  name: string;
}

export interface Post {
  id: number;
  authorId: number;
  authorName: string;
  authorRole: string;
  authorAvatarUrl: string | null;
  authorAvatarColor?: string;
  text: string;
  mediaUrl?: string | null;
  mediaKind?: 'image' | 'video' | null;
  createdAt: number;
  likes: number[]; // user IDs
  comments: PostComment[];
}

export interface PostComment {
  id: number;
  authorId: number;
  authorName: string;
  text: string;
  createdAt: number;
}

export interface Chat {
  id: number;
  name: string;
  groupId: number | null;
  type: 'general' | 'class' | 'direct' | 'group';
  unreadCount?: number;
  otherUser?: User;
  lastMessage?: {
    text?: string;
    senderName?: string;
    createdAt?: number;
  };
}

export interface Message {
  id: number;
  chatId: number;
  userId?: number;
  senderId?: number;
  authorName?: string;
  senderName?: string;
  authorRole?: string;
  authorAvatarUrl?: string | null;
  authorAvatarColor?: string;
  text?: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  forwardedFrom?: string | null;
  createdAt: number;
}

export interface QuestionOption {
  id?: number;
  text: string;
  correct: boolean;
}

export interface Question {
  id?: number;
  text: string;
  allowMultiple?: boolean;
  options: QuestionOption[];
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  rewardXp?: number;
  rewardCoins?: number;
  xpReward?: number;
  coinsReward?: number;
  dueDate?: string | number | null;
  deadline?: number | null;
  type?: 'text' | 'test' | 'ar' | 'regular';
  authorId?: number;
  groupName?: string;
  assignedTo?: {
    type: 'group' | 'students' | 'all';
    groupId?: number | null;
    studentIds?: number[];
  };
  questions?: Question[];
  arLocation?: {
    label: string;
    lat: number;
    lng: number;
    radiusMeters?: number;
  } | null;
  imageUrl?: string | null;
  mySubmission?: {
    id: number;
    status: 'pending' | 'graded';
    grade?: string | number;
    autoScore?: number;
    feedback?: string;
    text?: string;
    submittedAt?: number;
    createdAt?: number;
  } | null;
}

export interface ArPoint {
  assignmentId: number;
  title: string;
  label: string;
  lat: number;
  lng: number;
  completed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  id: number;
  fullName: string;
  avatarUrl?: string | null;
  avatarColor?: string;
  level?: number;
  xp?: number;
  completedCount?: number;
}

export interface FriendRequest {
  id: number;
  user: User;
  createdAt: number;
}

export type FriendshipStatus = 'none' | 'friends' | 'incoming' | 'outgoing' | 'self';

export interface Product {
  id: number;
  name: string;
  description: string;
  priceCoins: number;
  imageUrl?: string | null;
  category?: 'merch' | 'style' | 'pet';
  colorHex?: string | null;
  slot?: 'head' | 'body' | 'limbs' | 'hat' | 'outfit' | 'boots' | 'color' | null;
  rarity?: ItemRarity;
  petType?: PetType;
  setName?: string;
  code?: string;
  icon?: string | null;
  stock?: number;
}

export interface AdminStats {
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalGroups: number;
  onlineStudents: number;
  onlineTeachers: number;
  onlineTotal: number;
  visitsToday: number;
  totalAssignments: number;
  totalPosts: number;
  totalOrders: number;
  totalArCompletions: number;
}

function getToken(): string | null {
  return localStorage.getItem('hermes_token');
}

export function setToken(token: string) {
  localStorage.setItem('hermes_token', token);
}

export function clearToken() {
  localStorage.removeItem('hermes_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(res.token);
    return res;
  },

  async register(username: string, password: string, fullName: string, groupId: number): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, fullName, groupId }),
    });
    setToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/me');
  },

  async updateMe(data: { bio?: string; avatarColor?: string }): Promise<{ user: User }> {
    return request<{ user: User }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async uploadAvatar(dataUrl: string): Promise<{ avatarUrl: string; user: User }> {
    return request<{ avatarUrl: string; user: User }>('/users/me/avatar', {
      method: 'POST',
      body: JSON.stringify({ mediaData: dataUrl, avatar: dataUrl }),
    });
  },

  async setAvatarColor(color: string): Promise<{ user: User }> {
    return request<{ user: User }>('/users/me/avatar', {
      method: 'POST',
      body: JSON.stringify({ color }),
    });
  },

  async resetAvatar(): Promise<{ user: User }> {
    return request<{ user: User }>('/users/me/avatar', {
      method: 'DELETE',
    });
  },

  // Groups
  async getGroups(): Promise<{ groups: Group[] }> {
    return request<{ groups: Group[] }>('/groups');
  },

  // Users & Profiles
  async searchUsers(query: string, role?: string): Promise<{ users: User[] }> {
    const q = encodeURIComponent(query);
    const roleParam = role ? `&role=${role}` : '';
    return request<{ users: User[] }>(`/users/search?q=${q}${roleParam}`);
  },

  async getUser(userId: number): Promise<{ user: User; friendshipStatus: FriendshipStatus; friendsCount: number }> {
    return request<{ user: User; friendshipStatus: FriendshipStatus; friendsCount: number }>(`/users/${userId}`);
  },

  async getUserPosts(userId: number): Promise<{ user: User; posts: Post[]; friendshipStatus: FriendshipStatus; friendsCount: number }> {
    return request<{ user: User; posts: Post[]; friendshipStatus: FriendshipStatus; friendsCount: number }>(`/users/${userId}/posts`);
  },

  // Direct Chats
  async startDirectChat(userId: number): Promise<{ chat: Chat }> {
    return request<{ chat: Chat }>('/chats/direct', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  // Friends & Relations
  async getFriends(): Promise<{ friends: User[]; incoming: FriendRequest[]; outgoing: FriendRequest[] }> {
    return request<{ friends: User[]; incoming: FriendRequest[]; outgoing: FriendRequest[] }>('/friends');
  },

  async sendFriendRequest(targetUserId: number): Promise<{ ok: boolean; status: string; message: string }> {
    return request<{ ok: boolean; status: string; message: string }>('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  },

  async acceptFriendRequest(payload: { requestId?: number; userId?: number }): Promise<{ ok: boolean; friend?: User; message: string }> {
    return request<{ ok: boolean; friend?: User; message: string }>('/friends/accept', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async declineFriendRequest(payload: { requestId?: number; userId?: number }): Promise<{ ok: boolean; message: string }> {
    return request<{ ok: boolean; message: string }>('/friends/decline', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async removeFriend(friendId: number): Promise<{ ok: boolean; message: string }> {
    return request<{ ok: boolean; message: string }>('/friends/remove', {
      method: 'POST',
      body: JSON.stringify({ friendId }),
    });
  },

  // Feed & Posts
  async getFeed(): Promise<{ posts: Post[] }> {
    return request<{ posts: Post[] }>('/posts/feed');
  },

  async createPost(text: string, mediaDataUrl?: string | null, toFeed = true): Promise<{ post: Post }> {
    return request<{ post: Post }>('/posts', {
      method: 'POST',
      body: JSON.stringify({
        text,
        media: mediaDataUrl,
        mediaData: mediaDataUrl,
        target: toFeed ? 'feed' : 'profile',
        toFeed,
      }),
    });
  },

  async likePost(postId: number): Promise<{ post: Post }> {
    return request<{ post: Post }>(`/posts/${postId}/like`, {
      method: 'POST',
    });
  },

  async commentPost(postId: number, text: string): Promise<{ comment: PostComment; post: Post }> {
    return request<{ comment: PostComment; post: Post }>(`/posts/${postId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  async deletePost(postId: number): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/posts/${postId}`, {
      method: 'DELETE',
    });
  },


  // Chats & Messaging
  async getChats(): Promise<{ chats: Chat[] }> {
    return request<{ chats: Chat[] }>('/chats');
  },

  async getMessages(chatId: number): Promise<{ messages: Message[] }> {
    const res = await request<{ messages: any[] }>(`/chats/${chatId}/messages`);
    return {
      messages: (res.messages || []).map((m) => ({
        ...m,
        senderId: m.userId ?? m.senderId,
        senderName: m.authorName ?? m.senderName ?? 'Пользователь',
      })),
    };
  },

  async sendMessage(chatId: number, text?: string, mediaDataUrl?: string): Promise<{ message: Message }> {
    const res = await request<{ message: any }>(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, mediaData: mediaDataUrl }),
    });
    return {
      message: {
        ...res.message,
        senderId: res.message.userId ?? res.message.senderId,
        senderName: res.message.authorName ?? res.message.senderName ?? 'Пользователь',
      },
    };
  },

  async forwardMessage(messageId: number, targetChatId: number): Promise<{ message: Message }> {
    const res = await request<{ message: any }>(`/messages/${messageId}/forward`, {
      method: 'POST',
      body: JSON.stringify({ targetChatId }),
    });
    return {
      message: {
        ...res.message,
        senderId: res.message.userId ?? res.message.senderId,
        senderName: res.message.authorName ?? res.message.senderName ?? 'Пользователь',
      },
    };
  },

  async pinChat(chatId: number): Promise<{ pinned: boolean }> {
    return request<{ pinned: boolean }>(`/chats/${chatId}/pin`, {
      method: 'POST',
    });
  },

  async hideChat(chatId: number): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/chats/${chatId}/hide`, {
      method: 'POST',
    });
  },

  async deleteMessage(messageId: number): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/messages/${messageId}`, {
      method: 'DELETE',
    });
  },

  // Assignments / Missions
  async getAssignments(): Promise<{ assignments: Assignment[] }> {
    return request<{ assignments: Assignment[] }>('/assignments');
  },

  async deleteAssignment(assignmentId: number): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/assignments/${assignmentId}`, {
      method: 'DELETE',
    });
  },

  async submitAssignment(assignmentId: number, comment?: string, answers?: any, fileDataUrl?: string): Promise<{ submission: any }> {
    return request<{ submission: any }>(`/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ comment, text: comment, answers, fileDataUrl }),
    });
  },

  async createAssignment(data: {
    title: string;
    description?: string;
    type: 'text' | 'test' | 'ar';
    assignedTo: { type: 'all' } | { type: 'group'; groupId: number } | { type: 'students'; studentIds: number[] };
    xpReward: number;
    coinsReward?: number;
    dueDate?: string | null;
    questions?: Question[];
    arLocation?: { lat: number; lng: number; label: string };
    imageMediaData?: string | null;
  }): Promise<{ assignment: Assignment }> {
    return request<{ assignment: Assignment }>('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAssignmentSubmissions(assignmentId: number): Promise<{ submissions: any[] }> {
    return request<{ submissions: any[] }>(`/assignments/${assignmentId}/submissions`);
  },

  async gradeSubmission(submissionId: number, grade: string, xpAwarded: number, coinsAwarded: number): Promise<any> {
    return request<any>(`/submissions/${submissionId}/grade`, {
      method: 'POST',
      body: JSON.stringify({ grade, xpAwarded, coinsAwarded }),
    });
  },

  async getArPoints(): Promise<{ points: ArPoint[] }> {
    return request<{ points: ArPoint[] }>('/ar-points');
  },

  // Leaderboard
  async getLeaderboard(): Promise<{ byLevel: LeaderboardEntry[]; byAssignments: LeaderboardEntry[]; myId: number }> {
    return request<{ byLevel: LeaderboardEntry[]; byAssignments: LeaderboardEntry[]; myId: number }>('/leaderboard');
  },

  // Daily Rewards
  async getDailyRewardsStatus(): Promise<DailyRewardsStatus> {
    return request<DailyRewardsStatus>('/daily-rewards/status');
  },

  async claimDailyReward(): Promise<{ ok: boolean; claimedDay: number; reward: any; user: User; pet?: PetData }> {
    return request<{ ok: boolean; claimedDay: number; reward: any; user: User; pet?: PetData }>('/daily-rewards/claim', {
      method: 'POST',
    });
  },

  // Pet
  async getPet(): Promise<{ pet: PetData }> {
    return request<{ pet: PetData }>('/pet');
  },

  async choosePet(petType: PetType, name?: string): Promise<{ pet: PetData; user: User; message: string }> {
    return request<{ pet: PetData; user: User; message: string }>('/pet/choose', {
      method: 'POST',
      body: JSON.stringify({ petType, name }),
    });
  },

  async feedPet(foodType: 'battery' | 'crystal' | 'pie'): Promise<{ pet: PetData; user: User; message: string }> {
    return request<{ pet: PetData; user: User; message: string }>('/pet/feed', {
      method: 'POST',
      body: JSON.stringify({ foodType }),
    });
  },

  async playPet(): Promise<{ pet: PetData; phrase: string }> {
    return request<{ pet: PetData; phrase: string }>('/pet/play', {
      method: 'POST',
    });
  },

  async equipPet(slot: 'head' | 'body' | 'limbs' | 'hat' | 'outfit' | 'boots' | 'color', itemId: string | null): Promise<{ pet: PetData }> {
    return request<{ pet: PetData }>('/pet/equip', {
      method: 'POST',
      body: JSON.stringify({ slot, itemId }),
    });
  },

  async renamePet(name: string): Promise<{ pet: PetData }> {
    return request<{ pet: PetData }>('/pet/rename', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  // Shop / Merch
  async getProducts(): Promise<{ products: Product[] }> {
    return request<{ products: Product[] }>('/products');
  },

  async buyProduct(productId: number): Promise<{ purchase: any; user: User; pet?: PetData; message?: string }> {
    return request<{ purchase: any; user: User; pet?: PetData; message?: string }>('/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  },

  async createAdminProduct(data: {
    name: string;
    description?: string;
    priceCoins: number;
    mediaData?: string | null;
    category?: 'merch' | 'style' | 'pet';
    colorHex?: string | null;
    slot?: string | null;
    icon?: string | null;
  }): Promise<{ product: Product }> {
    return request<{ product: Product }>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteAdminProduct(productId: number): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/admin/products/${productId}`, {
      method: 'DELETE',
    });
  },

  // Admin
  async getAdminStats(): Promise<AdminStats> {
    return request<AdminStats>('/admin/stats');
  },

  async createAdminGroup(name: string): Promise<{ group: Group }> {
    return request<{ group: Group }>('/admin/groups', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async deleteAdminGroup(groupId: number): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/admin/groups/${groupId}`, {
      method: 'DELETE',
    });
  },

  async getAdminUsers(): Promise<{ users: User[] }> {
    return request<{ users: User[] }>('/admin/users');
  },

  async changeUserRole(userId: number, role: string, groupId?: number | null): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/admin/users/${userId}/role`, {
      method: 'POST',
      body: JSON.stringify({ role, groupId }),
    });
  },

  async createTeacher(username: string, password: string, fullName: string): Promise<{ user: User }> {
    return request<{ user: User }>('/admin/teachers', {
      method: 'POST',
      body: JSON.stringify({ username, password, fullName }),
    });
  },

  async deleteUser(userId: number): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  // Backups
  async getBackupSettings(): Promise<{ intervalDays: number; lastBackupAt: number | null; nextBackupAt: number | null }> {
    return request<{ intervalDays: number; lastBackupAt: number | null; nextBackupAt: number | null }>('/admin/backup/settings');
  },

  async saveBackupSettings(intervalDays: number): Promise<{ success: boolean; intervalDays: number }> {
    return request<{ success: boolean; intervalDays: number }>('/admin/backup/settings', {
      method: 'POST',
      body: JSON.stringify({ intervalDays }),
    });
  },

  async getBackupList(): Promise<{ backups: { filename: string; size: number; createdAt: number }[] }> {
    return request<{ backups: { filename: string; size: number; createdAt: number }[] }>('/admin/backup/list');
  },

  async createBackup(): Promise<{ success: boolean; filename: string }> {
    return request<{ success: boolean; filename: string }>('/admin/backup/create', {
      method: 'POST',
    });
  },

  async deleteBackup(filename: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/admin/backup/${filename}`, {
      method: 'DELETE',
    });
  },

  async restoreBackup(backupData: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/admin/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ backupData }),
    });
  },
};
