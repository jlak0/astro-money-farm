// Utility functions
export const formatDate = (date: Date) => date.toISOString().split('T')[0];
export const slugify = (str: string) => str.toLowerCase().replace(/\s+/g, '-');
