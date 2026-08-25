import { Router, Request, Response } from "express";
import { BlogStorage } from "./blog-storage";

function getParam(p: string | string[] | undefined): string {
  return typeof p === 'string' ? p : (p && p[0]) || '';
}

export function createBlogRouter(blog: BlogStorage): Router {
  const router = Router();

  router.get("/api/blog/posts", (_req: Request, res: Response) => {
    res.json(blog.listPublished());
  });

  router.get("/api/blog/posts/all", (_req: Request, res: Response) => {
    res.json(blog.listAll());
  });

  router.get("/api/blog/posts/:slug", (req: Request, res: Response) => {
    const slug = getParam(req.params.slug);
    const post = blog.getBySlug(slug);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  });

  router.post("/api/blog/posts", (req: Request, res: Response) => {
    const { title, slug, excerpt, content, contentHtml, author, tags, coverUrl, status } = req.body;
    if (!title || !slug || !content) {
      return res.status(400).json({ error: "title, slug, and content are required" });
    }
    const post = blog.create({
      title, slug, excerpt: excerpt || "", content, contentHtml: contentHtml || "",
      author: author || "Viseron", tags: tags || [], coverUrl: coverUrl || "",
      publishedAt: null, status: status || "draft",
    });
    res.status(201).json(post);
  });

  router.put("/api/blog/posts/:id", (req: Request, res: Response) => {
    const id = getParam(req.params.id);
    const updated = blog.update(id, req.body);
    if (!updated) return res.status(404).json({ error: "Post not found" });
    res.json(updated);
  });

  router.post("/api/blog/posts/:id/publish", (req: Request, res: Response) => {
    const id = getParam(req.params.id);
    const published = blog.publish(id);
    if (!published) return res.status(404).json({ error: "Post not found" });
    res.json(published);
  });

  router.delete("/api/blog/posts/:id", (req: Request, res: Response) => {
    const id = getParam(req.params.id);
    const deleted = blog.delete(id);
    if (!deleted) return res.status(404).json({ error: "Post not found" });
    res.json({ ok: true });
  });

  router.get("/api/blog/stats", (_req: Request, res: Response) => {
    res.json(blog.count());
  });

  return router;
}
