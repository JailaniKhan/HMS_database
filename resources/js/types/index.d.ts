export interface User {
    id: number;
    name: string;
    email?: string;
    username?: string;
    avatar?: string;
    role?: string;
    permissions?: string[];
}

export interface BreadcrumbItem {
    label?: string;
    href?: string;
    title?: string;
}

 
export interface NavItem {
    label?: string;
    title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    href: string | any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon?: any; // Icon component type
    items?: NavItem[]; // Submenu items
    permission?: string; // Required permission to view this item
}

export interface SharedData {
    auth: {
        user: User;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash?: {
        success?: string;
        error?: string;
    };
};
