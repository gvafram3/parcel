import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useStation } from "../../contexts/StationContext";

export const Preferences = (): JSX.Element => {
    const { currentUser } = useStation();

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">

                    <Card className="border border-[#d1d1d1] bg-white">
                        <CardContent className="p-6">
                            <h2 className="text-lg font-bold text-neutral-800 mb-4">Account Settings</h2>
                            <div className="space-y-4">
                                <div>
                                    <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Email Notifications
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="email-notifications" defaultChecked className="rounded" />
                                        <label htmlFor="email-notifications" className="text-sm text-neutral-700">
                                            Receive email notifications for important updates
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Language
                                    </Label>
                                    <select className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]">
                                        <option>English</option>
                                        <option>French</option>
                                    </select>
                                </div>

                                <div>
                                    <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                        Time Zone
                                    </Label>
                                    <select className="w-full px-3 py-2 border border-[#d1d1d1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea690c]">
                                        <option>GMT (UTC+0)</option>
                                        <option>GMT+1 (UTC+1)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <Button className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90">
                                    Save Preferences
                                </Button>
                                <Button variant="outline" className="border border-[#d1d1d1]">
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
};

