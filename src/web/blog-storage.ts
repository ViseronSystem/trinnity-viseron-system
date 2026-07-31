import fs from "fs-extra";
import path from "path";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  contentHtml: string;
  author: string;
  tags: string[];
  coverUrl: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "published";
}

const DATA_FILE = path.join(process.cwd(), "data", "blog", "posts.json");

export class BlogStorage {
  private posts: BlogPost[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(DATA_FILE)) {
        this.posts = fs.readJsonSync(DATA_FILE);
      }
    } catch {
      this.posts = [];
    }
  }

  private save(): void {
    fs.ensureDirSync(path.dirname(DATA_FILE));
    fs.writeJsonSync(DATA_FILE, this.posts, { spaces: 2 });
  }

  listPublished(): BlogPost[] {
    return this.posts
      .filter(p => p.status === "published")
      .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
  }

  listAll(): BlogPost[] {
    return [...this.posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getBySlug(slug: string): BlogPost | undefined {
    return this.posts.find(p => p.slug === slug);
  }

  getById(id: string): BlogPost | undefined {
    return this.posts.find(p => p.id === id);
  }

  create(post: Omit<BlogPost, "id" | "createdAt" | "updatedAt">): BlogPost {
    const now = new Date().toISOString();
    const newPost: BlogPost = {
      ...post,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };
    this.posts.push(newPost);
    this.save();
    return newPost;
  }

  update(id: string, updates: Partial<BlogPost>): BlogPost | undefined {
    const idx = this.posts.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.posts[idx] = { ...this.posts[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.posts[idx];
  }

  publish(id: string): BlogPost | undefined {
    return this.update(id, { status: "published", publishedAt: new Date().toISOString() });
  }

  delete(id: string): boolean {
    const idx = this.posts.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.posts.splice(idx, 1);
    this.save();
    return true;
  }

  count(): { total: number; published: number; drafts: number } {
    return {
      total: this.posts.length,
      published: this.posts.filter(p => p.status === "published").length,
      drafts: this.posts.filter(p => p.status === "draft").length,
    };
  }

  private generateId(): string {
    return `post_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
}
