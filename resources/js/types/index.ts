export * from './patient';
export * from './doctor';
export * from './appointment';
export * from './medicine';
export * from './lab-test';
export * from './bill';
export * from './department';
export * from './rbac';
export * from './dashboard';

// Re-export common types from index.d.ts
export type { User, BreadcrumbItem, NavItem, SharedData, PageProps } from './index.d';