import { getCollection } from 'astro:content';
import {
  DEFAULT_PAGINATION,
  countTags,
  paginateItems,
  type PaginationMeta,
  type TagCount
} from '../utils';

type BlogPost = Awaited<ReturnType<typeof getCollection<'blog'>>>[number];

interface BlogStaticPathOptions {
  postsPerPage?: number;
  visibleTagsLimit?: number;
}

interface BlogIndexPageProps {
  posts: BlogPost[];
  pagination: PaginationMeta;
  categories: string[];
  visibleTags: TagCount[];
}

function getPostsPerPage(options?: BlogStaticPathOptions) {
  return options?.postsPerPage ?? DEFAULT_PAGINATION.postsPerPage;
}

function sortPosts(posts: BlogPost[]) {
  return [...posts].sort((a, b) =>
    b.data.publishDate.valueOf() - a.data.publishDate.valueOf()
  );
}

function getCategories(posts: BlogPost[]) {
  return [...new Set(posts.map(post => post.data.category))];
}

function paginatePosts(
  posts: BlogPost[],
  currentPage: number,
  basePath: string,
  options?: BlogStaticPathOptions
) {
  return paginateItems(posts, {
    currentPage,
    pageSize: getPostsPerPage(options),
    basePath
  });
}

function createIndexProps(
  posts: BlogPost[],
  pagination: PaginationMeta,
  allPosts: BlogPost[],
  options?: BlogStaticPathOptions
): BlogIndexPageProps {
  return {
    posts,
    pagination,
    categories: getCategories(allPosts),
    visibleTags: countTags(
      allPosts,
      options?.visibleTagsLimit ?? DEFAULT_PAGINATION.visibleTagsLimit
    )
  };
}

export async function getBlogPostStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

export async function getBlogIndexPageProps(
  options?: BlogStaticPathOptions
): Promise<BlogIndexPageProps> {
  const allPosts = await getCollection('blog');
  const sortedPosts = sortPosts(allPosts);
  const { items, pagination } = paginatePosts(sortedPosts, 1, '/blog', options);

  return createIndexProps(items, pagination, allPosts, options);
}

export async function getBlogIndexStaticPaths(options?: BlogStaticPathOptions) {
  const allPosts = await getCollection('blog');
  const sortedPosts = sortPosts(allPosts);
  const firstPage = paginatePosts(sortedPosts, 1, '/blog', options);
  const paths = [];

  for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
    const { items, pagination } = paginatePosts(sortedPosts, page, '/blog', options);

    paths.push({
      params: { page: String(page) },
      props: createIndexProps(items, pagination, allPosts, options)
    });
  }

  return paths;
}

export async function getBlogCategoryStaticPaths(options?: BlogStaticPathOptions) {
  const posts = await getCollection('blog');
  const categories = getCategories(posts);
  const paths = [];

  for (const category of categories) {
    const categoryPosts = sortPosts(posts.filter(p => p.data.category === category));
    const firstPage = paginatePosts(
      categoryPosts,
      1,
      `/blog/category/${category}`,
      options
    );

    for (let page = 1; page <= firstPage.pagination.totalPages; page += 1) {
      const { items, pagination } =
        page === 1
          ? firstPage
          : paginatePosts(categoryPosts, page, `/blog/category/${category}`, options);

      paths.push({
        params:
          page === 1
            ? { category }
            : { category, page: String(page) },
        props: {
          category,
          posts: items,
          pagination
        }
      });
    }
  }

  return paths;
}

export async function getBlogTagStaticPaths(options?: BlogStaticPathOptions) {
  const posts = await getCollection('blog');
  const allTags = [...new Set(posts.flatMap(p => p.data.tags || []))];
  const paths = [];

  for (const tag of allTags) {
    const tagPosts = sortPosts(posts.filter(p => p.data.tags?.includes(tag)));
    const firstPage = paginatePosts(tagPosts, 1, `/blog/tag/${tag}`, options);

    for (let page = 1; page <= firstPage.pagination.totalPages; page += 1) {
      const { items, pagination } =
        page === 1
          ? firstPage
          : paginatePosts(tagPosts, page, `/blog/tag/${tag}`, options);

      paths.push({
        params:
          page === 1
            ? { tag }
            : { tag, page: String(page) },
        props: {
          tag,
          posts: items,
          pagination
        }
      });
    }
  }

  return paths;
}
