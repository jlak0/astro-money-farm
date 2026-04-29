import { getCollection } from 'astro:content';

export async function getBlogPostStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

export async function getBlogCategoryStaticPaths() {
  const posts = await getCollection('blog');
  const categories = [...new Set(posts.map(p => p.data.category))];

  return categories.map(category => ({
    params: { category },
    props: {
      category,
      posts: posts
        .filter(p => p.data.category === category)
        .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
    }
  }));
}

export async function getBlogTagStaticPaths() {
  const posts = await getCollection('blog');
  const allTags = [...new Set(posts.flatMap(p => p.data.tags || []))];

  return allTags.map(tag => ({
    params: { tag },
    props: {
      tag,
      posts: posts
        .filter(p => p.data.tags?.includes(tag))
        .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
    }
  }));
}
