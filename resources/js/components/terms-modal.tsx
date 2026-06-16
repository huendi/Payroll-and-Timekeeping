import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface TermsModalProps {
    trigger?: React.ReactNode;
}

export function TermsModal({ trigger }: TermsModalProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        variant="link"
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                        Terms and Conditions
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Terms and Conditions</DialogTitle>
                    <DialogDescription>
                        Please read our terms and conditions carefully.
                    </DialogDescription>
                </DialogHeader>
                <div className="h-[60vh] overflow-y-auto pr-4">
                    <div className="space-y-4 text-sm text-muted-foreground">
                        <h3 className="font-medium text-foreground">
                            1. Introduction
                        </h3>
                        <p>
                            Welcome to our Payroll System. By accessing or using
                            our system, you agree to be bound by these Terms and
                            Conditions.
                        </p>

                        <h3 className="font-medium text-foreground">
                            2. User Account
                        </h3>
                        <p>
                            You are responsible for maintaining the
                            confidentiality of your account credentials and for
                            all activities that occur under your account.
                        </p>

                        <h3 className="font-medium text-foreground">
                            3. Data Privacy
                        </h3>
                        <p>
                            We process your personal data in accordance with our
                            Privacy Policy. We implement appropriate technical
                            and organizational measures to protect your data.
                        </p>

                        <h3 className="font-medium text-foreground">
                            4. System Usage
                        </h3>
                        <p>
                            You agree to use the system only for lawful purposes
                            and in accordance with these Terms. Unauthorized
                            access or misuse of the system is strictly
                            prohibited.
                        </p>

                        <h3 className="font-medium text-foreground">
                            5. Intellectual Property
                        </h3>
                        <p>
                            All content, features, and functionality of this
                            system are owned by the company and are protected by
                            international copyright, trademark, and other
                            intellectual property laws.
                        </p>

                        <h3 className="font-medium text-foreground">
                            6. Modifications
                        </h3>
                        <p>
                            We reserve the right to modify these terms at any
                            time. Continued use of the system following any
                            changes indicates your acceptance of the new terms.
                        </p>

                        <h3 className="font-medium text-foreground">
                            7. Termination
                        </h3>
                        <p>
                            We reserve the right to terminate or suspend access
                            to our service immediately, without prior notice or
                            liability, for any reason whatsoever.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
