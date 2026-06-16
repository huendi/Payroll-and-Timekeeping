import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { useState } from 'react';

interface GenerateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function GenerateModal({
    open,
    onOpenChange,
}: GenerateModalProps) {
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [isLoading, setIsLoading] = useState(false);

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from(
        { length: 10 },
        (_, i) => currentYear - i,
    ).sort((a, b) => b - a);

    const handleGenerate = async () => {
        if (!year || isNaN(parseInt(year))) {
            alert('Please select a valid year');
            return;
        }

        setIsLoading(true);

        router.post(
            '/thirteenth-month-pay/generate',
            { year: parseInt(year) },
            {
                onFinish: () => {
                    setIsLoading(false);
                    onOpenChange(false);
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Generate 13th Month Pay</DialogTitle>
                    <DialogDescription>
                        Select the year to generate 13th month pay for all
                        employees. This will calculate the 13th month pay based
                        on all payslips from that year.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <select
                            id="year"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
                        >
                            {yearOptions.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                        <p className="mb-1 font-semibold">Calculation:</p>
                        <p>
                            13th Month Pay = (Total Gross Pay - Total SSS
                            Deduction) ÷ 12
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="gap-2"
                    >
                        {isLoading ? 'Generating...' : 'Generate'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
