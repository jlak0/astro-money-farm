import { createSitemapGET } from '@astro-money-farm/core/routes';
import { getSiteUrl } from '../config';

export const GET = createSitemapGET(getSiteUrl);
