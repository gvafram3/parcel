import { Card, CardContent } from "../../components/ui/card";
import { HelpCircleIcon, BookOpenIcon, MessageCircleIcon, FileTextIcon } from "lucide-react";

export const Help = (): JSX.Element => {
    const helpSections = [
        {
            icon: BookOpenIcon,
            title: "User Guide",
            description: "Learn how to use the parcel management system",
            items: [
                "How to register a parcel",
                "How to assign parcels to riders",
                "How to track deliveries",
                "How to reconcile payments",
            ],
        },
        {
            icon: MessageCircleIcon,
            title: "FAQs",
            description: "Frequently asked questions",
            items: [
                "How do I reset my password?",
                "How do I update parcel status?",
                "How do I generate reports?",
                "How do I contact support?",
            ],
        },
        {
            icon: FileTextIcon,
            title: "Documentation",
            description: "System documentation and resources",
            items: [
                "API Documentation",
                "User Manual",
                "Training Materials",
                "Video Tutorials",
            ],
        },
    ];

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {helpSections.map((section, index) => {
                            const Icon = section.icon;
                            return (
                                <Card key={index} className="border border-[#d1d1d1] bg-white">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-[#ea690c]/10 rounded-lg">
                                                <Icon className="w-6 h-6 text-[#ea690c]" />
                                            </div>
                                            <h2 className="text-lg font-bold text-neutral-800">{section.title}</h2>
                                        </div>
                                        <p className="text-sm text-[#5d5d5d] mb-4">{section.description}</p>
                                        <ul className="space-y-2">
                                            {section.items.map((item, itemIndex) => (
                                                <li key={itemIndex} className="text-sm text-neutral-700 flex items-start gap-2">
                                                    <span className="text-[#ea690c] mt-1">•</span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <HelpCircleIcon className="w-6 h-6 text-[#ea690c]" />
                                <h2 className="text-lg font-bold text-neutral-800">Contact Support</h2>
                            </div>
                            <div className="space-y-3">
                                <p className="text-sm text-neutral-700">
                                    If you need additional help, please contact our support team:
                                </p>
                                <div className="space-y-2">
                                    <p className="text-sm text-neutral-700">
                                        <strong>Email:</strong> support@parcel.com
                                    </p>
                                    <p className="text-sm text-neutral-700">
                                        <strong>Phone:</strong> +233 555 000 000
                                    </p>
                                    <p className="text-sm text-neutral-700">
                                        <strong>Hours:</strong> Monday - Friday, 8:00 AM - 5:00 PM GMT
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
};

