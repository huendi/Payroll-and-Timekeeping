import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { canEdit } from '@/lib/auth';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PremiumType {
    id: number;
    category_id: number;
    name: string;
    description: string | null;
    regular_rate: string;
    special_rate: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface PremiumCategory {
    id: number;
    name: string;
    description: string | null;
    sort_order: number;
    is_active: boolean;
    premium_types: PremiumType[];
    created_at: string;
    updated_at: string;
}

interface Props {
    categories: PremiumCategory[];
}

export default function PremiumSetup({ categories }: Props) {
    const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [editingType, setEditingType] = useState<PremiumType | null>(null);

    const typeForm = useForm({
        regular_rate: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Premium Setup',
            href: '/premium-setup',
        },
    ];

    const formatCurrency = (amount: string | null) => {
        if (!amount) return '-';
        return parseFloat(amount).toFixed(2) + ' %';
    };

    const toggleCategory = (categoryId: number) => {
        setExpandedCategories((prev) =>
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : [...prev, categoryId],
        );
    };

    const handleEditType = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingType) return;

        const url = `/premium-categories/${editingType.category_id}/types/${editingType.id}`;

        typeForm.put(url, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Premium type updated successfully!');
                setShowTypeModal(false);
                typeForm.reset();
                setEditingType(null);
                window.location.reload();
            },
            onError: () => {
                toast.error('Failed to update premium type.');
            },
        });
    };

    const openTypeModal = (type: PremiumType) => {
        setEditingType(type);
        typeForm.setData({
            regular_rate: type.regular_rate,
        });
        setShowTypeModal(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Premium Setup" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Premium Setup
                        </h1>
                        <p className="text-muted-foreground">
                            Edit premium rates
                        </p>
                    </div>
                </div>

                {/* Categories */}
                <div className="space-y-4">
                    {categories.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    No premium categories found.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        categories.map((category) => (
                            <Card key={category.id}>
                                <CardHeader
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => toggleCategory(category.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-1 items-center gap-4">
                                            {expandedCategories.includes(
                                                category.id,
                                            ) ? (
                                                <ChevronUp className="h-5 w-5" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5" />
                                            )}
                                            <div>
                                                <CardTitle>
                                                    {category.name}
                                                </CardTitle>
                                                {category.description && (
                                                    <CardDescription>
                                                        {category.description}
                                                    </CardDescription>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                {expandedCategories.includes(category.id) && (
                                    <CardContent>
                                        <div className="space-y-4">
                                            {category.premium_types.length ===
                                            0 ? (
                                                <p className="py-4 text-center text-sm text-muted-foreground">
                                                    No premium types in this
                                                    category.
                                                </p>
                                            ) : (
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>
                                                                #
                                                            </TableHead>
                                                            <TableHead>
                                                                Name
                                                            </TableHead>
                                                            <TableHead className="text-right">
                                                                Rate (%)
                                                            </TableHead>
                                                            {/* <TableHead className="text-right">
                                                                Actions
                                                            </TableHead> */}
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {category.premium_types.map(
                                                            (type, index) => (
                                                                <TableRow
                                                                    key={
                                                                        type.id
                                                                    }
                                                                >
                                                                    <TableCell className="font-medium">
                                                                        {index +
                                                                            1}
                                                                    </TableCell>
                                                                    <TableCell className="font-medium">
                                                                        {
                                                                            type.name
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        {formatCurrency(
                                                                            type.regular_rate,
                                                                        )}
                                                                    </TableCell>
                                                                    {/* <TableCell className="text-right">
                                                                        {canEdit(
                                                                            'settings',
                                                                        ) && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() =>
                                                                                    openTypeModal(
                                                                                        type,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Edit className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                    </TableCell> */}
                                                                </TableRow>
                                                            ),
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            )}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Edit Premium Type Modal */}
            <Dialog open={showTypeModal} onOpenChange={setShowTypeModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Premium Type</DialogTitle>
                        <DialogDescription>
                            Update the premium rate for {editingType?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditType}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="regular_rate">Rate (%) *</Label>
                                <Input
                                    id="regular_rate"
                                    type="number"
                                    step="0.01"
                                    value={typeForm.data.regular_rate}
                                    onChange={(e) =>
                                        typeForm.setData(
                                            'regular_rate',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g., 10.00"
                                    required
                                />
                                {typeForm.errors.regular_rate && (
                                    <p className="text-sm text-red-500">
                                        {typeForm.errors.regular_rate}
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowTypeModal(false);
                                    setEditingType(null);
                                }}
                                disabled={typeForm.processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={typeForm.processing}
                            >
                                {typeForm.processing
                                    ? 'Updating...'
                                    : 'Update Rate'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
