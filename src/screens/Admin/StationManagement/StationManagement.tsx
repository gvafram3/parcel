import { useState, useEffect } from "react";
import { Plus, MapPin, Users, X } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { Label } from "../../../components/ui/label";
import { mockStations, addStation, getStationUserCount } from "../../../data/mockData";
import { Station } from "../../../types";

export const StationManagement = (): JSX.Element => {
    const [stations, setStations] = useState<Station[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedStation, setSelectedStation] = useState<Station | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        location: "",
    });

    useEffect(() => {
        setStations(mockStations);
    }, []);

    const handleAddStation = () => {
        if (formData.name.trim() && formData.location.trim()) {
            const newStation = addStation(formData.name, formData.location);
            setStations([...stations, newStation]);
            setFormData({ name: "", location: "" });
            setShowAddForm(false);
            alert(`Station "${newStation.name}" created successfully!`);
        }
    };

    const toggleStationStatus = () => {
        // For now, we'll just show a message since Station type doesn't have status
        // In a real app, you'd update the station status
        alert("Station status toggle functionality - to be implemented with backend");
    };

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1"></div>
                        <Button
                            onClick={() => setShowAddForm(true)}
                            className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            New Station
                        </Button>
                    </div>

                    {/* Add Station Dialog */}
                    {showAddForm && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <Card className="w-full max-w-md rounded-lg border border-[#d1d1d1] bg-white shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold text-neutral-800">Create New Station</h3>
                                        <button
                                            onClick={() => {
                                                setShowAddForm(false);
                                                setFormData({ name: "", location: "" });
                                            }}
                                            className="text-[#9a9a9a] hover:text-neutral-800"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                Station Name <span className="text-[#e22420]">*</span>
                                            </Label>
                                            <Input
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g., Accra Central"
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>

                                        <div>
                                            <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                Location <span className="text-[#e22420]">*</span>
                                            </Label>
                                            <Input
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                placeholder="e.g., Accra, Ghana"
                                                className="border border-[#d1d1d1]"
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <Button
                                                onClick={handleAddStation}
                                                disabled={!formData.name.trim() || !formData.location.trim()}
                                                className="flex-1 bg-[#ea690c] text-white hover:bg-[#ea690c]/90 disabled:opacity-50"
                                            >
                                                Create Station
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setShowAddForm(false);
                                                    setFormData({ name: "", location: "" });
                                                }}
                                                variant="outline"
                                                className="flex-1 border border-[#d1d1d1]"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Stations Grid */}
                    {stations.length === 0 ? (
                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-12 text-center">
                                <MapPin className="w-16 h-16 text-[#9a9a9a] mx-auto mb-4 opacity-50" />
                                <p className="text-neutral-700 font-medium">No stations found</p>
                                <p className="text-sm text-[#5d5d5d] mt-2">
                                    Create your first station to get started
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stations.map((station) => {
                                const userCount = getStationUserCount(station.id);
                                return (
                                    <Card
                                        key={station.id}
                                        className={`border-2 transition-all cursor-pointer ${
                                            selectedStation?.id === station.id
                                                ? "border-[#ea690c] bg-orange-50"
                                                : "border-[#d1d1d1] hover:border-[#ea690c]"
                                        }`}
                                        onClick={() =>
                                            setSelectedStation(selectedStation?.id === station.id ? null : station)
                                        }
                                    >
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                {/* Header */}
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="font-bold text-lg text-neutral-800">{station.name}</h3>
                                                        <p className="text-xs text-[#5d5d5d]">{station.id}</p>
                                                    </div>
                                                    <Badge className="bg-green-100 text-green-800">
                                                        Active
                                                    </Badge>
                                                </div>

                                                {/* Location */}
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-[#5d5d5d]" />
                                                    <span className="text-sm text-neutral-700">{station.location}</span>
                                                </div>

                                                {/* Users */}
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-[#5d5d5d]" />
                                                    <span className="text-sm text-neutral-700">
                                                        {userCount} user{userCount !== 1 ? "s" : ""} assigned
                                                    </span>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2 pt-2">
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleStationStatus();
                                                        }}
                                                        variant="outline"
                                                        className="flex-1 text-sm border border-[#d1d1d1]"
                                                    >
                                                        Edit
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
