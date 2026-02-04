import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

function getItemId(title: string | undefined, label: string | undefined): string {
    return `nav-${(title || label || '').toLowerCase().replace(/\s+/g, '-')}`;
}

function NavItemComponent({ item }: { item: NavItem }) {
    const itemId = getItemId(item.title, item.label);

    // If item has sub-items, render as collapsible
    if (item.items && item.items.length > 0) {
        return (
            <Collapsible defaultOpen={false} className="group/collapsible">
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            data-testid={itemId}
                            className="group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!px-2 group-data-[collapsible=icon]:!py-2.5"
                        >
                            {item.icon && (
                                <item.icon
                                    aria-hidden="true"
                                    className="size-4 shrink-0 transition-colors group-data-[collapsible=icon]:size-5"
                                />
                            )}
                            <span className="truncate group-data-[collapsible=icon]:hidden">
                                {item.title || item.label}
                            </span>
                            <ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {item.items.map((subItem) => {
                                const subItemId = getItemId(subItem.title, subItem.label);
                                
                                return (
                                    <SidebarMenuSubItem key={subItem.title || subItem.label}>
                                        <SidebarMenuSubButton
                                            asChild
                                            data-testid={subItemId}
                                        >
                                            <Link
                                                href={subItem.href}
                                                aria-describedby={`${subItemId}-description`}
                                                prefetch={true}
                                            >
                                                {subItem.icon && (
                                                    <subItem.icon
                                                        aria-hidden="true"
                                                        className="size-4 shrink-0"
                                                    />
                                                )}
                                                <span>{subItem.title || subItem.label}</span>
                                                <span
                                                    id={`${subItemId}-description`}
                                                    className="sr-only"
                                                >
                                                    Navigate to {subItem.title || subItem.label} page
                                                </span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                );
                            })}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
            </Collapsible>
        );
    }

    // Regular menu item without sub-items
    return (
        <SidebarMenuItem className="relative">
            <SidebarMenuButton
                asChild
                data-testid={itemId}
                className="group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!px-2 group-data-[collapsible=icon]:!py-2.5"
            >
                <Link
                    href={item.href}
                    aria-describedby={`${itemId}-description`}
                    prefetch={true}
                    className="flex items-center gap-2 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-12"
                >
                    {item.icon && (
                        <item.icon
                            aria-hidden="true"
                            className="size-4 shrink-0 transition-colors group-data-[collapsible=icon]:size-5"
                        />
                    )}
                    <span className="truncate group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:absolute">{item.title || item.label}</span>
                    <span
                        id={`${itemId}-description`}
                        className="sr-only"
                    >
                        Navigate to {item.title || item.label} page
                    </span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

export function NavMain({ items = [] }: { items: NavItem[] }) {
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="sr-only">Main Navigation</SidebarGroupLabel>
            <SidebarMenu role="navigation" aria-label="Main navigation">
                {items.map((item) => (
                    <NavItemComponent key={item.title || item.label} item={item} />
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
