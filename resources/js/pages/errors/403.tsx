import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import { ShieldAlert } from 'lucide-react';

export default function Forbidden() {
    return (
        <>
            <Head title="403 - Forbidden" />
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 rounded-full bg-destructive/10 p-3">
                                <ShieldAlert className="h-12 w-12 text-destructive" />
                            </div>
                            <h1 className="mb-2 text-4xl font-bold">403</h1>
                            <h2 className="mb-2 text-xl font-semibold">
                                Access Forbidden
                            </h2>
                            <p className="mb-6 text-muted-foreground">
                                You don't have permission to access this
                                resource. Please contact your administrator if
                                you believe this is an error.
                            </p>
                            <Link href="/dashboard">
                                <Button>Go to Dashboard</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
