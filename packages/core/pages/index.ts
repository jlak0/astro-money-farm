export { default as AboutPage } from './AboutPage.astro';
export { default as BlogCategoryPage } from './BlogCategoryPage.astro';
export { default as BlogListPage } from './BlogListPage.astro';
export { default as BlogPostPage } from './BlogPostPage.astro';
export { default as BlogTagPage } from './BlogTagPage.astro';
export { default as FriendsPage } from './FriendsPage.astro';
export { default as HomePage } from './HomePage.astro';
export { default as SearchPage } from './SearchPage.astro';
export {
  getBlogCategoryStaticPaths,
  getBlogIndexPageProps,
  getBlogIndexStaticPaths,
  getBlogPostStaticPaths,
  getBlogTagStaticPaths
} from './static-paths';
