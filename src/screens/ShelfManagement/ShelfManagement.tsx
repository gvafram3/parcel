import React, { useState, useEffect } from "react";
import { Plus, Trash2, Package, AlertCircleIcon, X } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { useStation } from "../../contexts/StationContext";
import { getShelvesByStation, addShelf, deleteShelf, updateShelfParcelCount, getParcelsByStation } from "../../data/mockData";
import { Shelf } from "../../types";
import { canDeleteShelf } from "../../utils/dataHelpers";

export const ShelfManagement = (): JSX.Element => {
    const { currentStation, currentUser, userRole } = useStation();
    const [shelves, setShelves] = useState<Shelf[]>([]);
    const [parcels, setParcels] = useState<any[]>([]);
    const [newShelfName, setNewShelfName] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        if (currentStation) {
            const stationShelves = getShelvesByStation(currentStation.id);
            // Update parcel counts for all shelves
            stationShelves.forEach((shelf) => {
                updateShelfParcelCount(shelf.name, currentStation.id);
            });
            setShelves(getShelvesByStation(currentStation.id));

            // Load parcels to check if shelves can be deleted
            const stationParcels = getParcelsByStation(currentStation.id);
            setParcels(stationParcels);
        }
    }, [currentStation]);

    const handleAddShelf = () => {
        if (!newShelfName.trim() || !currentStation || !currentUser) return;

        // Check if shelf name already exists in this station
        const existingShelf = shelves.find(
            (s) => s.name.toLowerCase() === newShelfName.trim().toLowerCase()
        );
        if (existingShelf) {
            alert("A shelf with this name already exists in this station.");
            return;
        }

        const newShelf = addShelf(newShelfName.trim(), currentStation.id, currentUser.id);
        setShelves([...shelves, newShelf]);
        setNewShelfName("");
        setShowAddModal(false);
        alert(`Shelf "${newShelf.name}" created successfully!`);
    };

    const handleDeleteShelf = (shelfId: string, shelfName: string) => {
        if (!currentStation) return;

        // Check if shelf can be deleted
        if (!canDeleteShelf(shelfName, currentStation.id, parcels)) {
            alert(`Cannot delete shelf "${shelfName}". It contains parcels. Please move or deliver all parcels first.`);
            setDeleteConfirm(null);
            return;
        }

        const success = deleteShelf(shelfId, currentStation.id);
        if (success) {
            setShelves(shelves.filter((s) => s.id !== shelfId));
            alert(`Shelf "${shelfName}" deleted successfully!`);
        } else {
            alert("Failed to delete shelf. Please try again.");
        }
        setDeleteConfirm(null);
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setNewShelfName("");
    };

    const canManageShelves = userRole === "station-manager" || userRole === "admin";

    return (
        <div className="w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <main className="flex-1 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-800">Shelf Management</h1>
                            <p className="text-sm text-[#5d5d5d] mt-1">
                                {currentStation?.name} - Manage parcel shelves
                            </p>
                        </div>
                        {canManageShelves && (
                            <Button
                                onClick={() => setShowAddModal(true)}
                                className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2"
                            >
                                <Plus size={20} />
                                Add Shelf
                            </Button>
                        )}
                    </div>

                    {/* Add Shelf Modal */}
                    {showAddModal && canManageShelves && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <Card className="w-full max-w-md rounded-2xl border border-[#d1d1d1] bg-white shadow-lg">
                                <CardContent className="p-6">
                                    {/* Modal Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-50 rounded-lg">
                                                <Plus className="w-5 h-5 text-[#ea690c]" />
                                            </div>
                                            <h2 className="text-lg font-bold text-neutral-800">Add New Shelf</h2>
                                        </div>
                                        <button
                                            onClick={handleCloseModal}
                                            className="text-[#5d5d5d] hover:bg-gray-100 p-1 rounded transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Modal Content */}
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="block text-sm font-semibold text-neutral-800 mb-2">
                                                Shelf Name/Code <span className="text-[#e22420]">*</span>
                                            </Label>
                                            <Input
                                                value={newShelfName}
                                                onChange={(e) => setNewShelfName(e.target.value)}
                                                placeholder="e.g., A1, B2, Ground-Left"
                                                className="border border-[#d1d1d1] w-full"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleAddShelf();
                                                    }
                                                }}
                                                autoFocus
                                            />
                                            <p className="text-xs text-[#5d5d5d] mt-1">
                                                Enter a unique identifier for this shelf
                                            </p>
                                        </div>
                                    </div>

                                    {/* Modal Actions */}
                                    <div className="flex gap-3 mt-6">
                                        <Button
                                            onClick={handleCloseModal}
                                            variant="outline"
                                            className="flex-1 border border-[#d1d1d1] text-neutral-700 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleAddShelf}
                                            disabled={!newShelfName.trim()}
                                            className="flex-1 bg-[#ea690c] text-white hover:bg-[#ea690c]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Create Shelf
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Shelves Grid */}
                    {shelves.length === 0 ? (
                        <Card className="border border-[#d1d1d1] bg-white">
                            <CardContent className="p-12 text-center">
                                <Package className="w-16 h-16 text-[#9a9a9a] mx-auto mb-4 opacity-50" />
                                <p className="text-neutral-700 font-medium">No shelves found</p>
                                <p className="text-sm text-[#5d5d5d] mt-2">
                                    {canManageShelves
                                        ? "Create your first shelf to start organizing parcels"
                                        : "No shelves available in this station"}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {shelves.map((shelf) => {
                                const canDelete = canDeleteShelf(shelf.name, currentStation?.id || "", parcels);
                                const isDeleting = deleteConfirm === shelf.id;

                                return (
                                    <Card
                                        key={shelf.id}
                                        className="border border-[#d1d1d1] bg-white hover:shadow-md transition-shadow"
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 bg-orange-50 rounded-lg">
                                                        <Package className="w-6 h-6 text-[#ea690c]" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-neutral-800">{shelf.name}</h3>
                                                        <p className="text-xs text-[#5d5d5d]">ID: {shelf.id}</p>
                                                    </div>
                                                </div>
                                                {canManageShelves && (
                                                    <div className="flex gap-1">
                                                        {!isDeleting && canDelete && (
                                                            <button
                                                                onClick={() => setDeleteConfirm(shelf.id)}
                                                                className="text-[#e22420] hover:bg-red-50 p-2 rounded transition-colors"
                                                                title="Delete shelf"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                        {isDeleting && (
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleDeleteShelf(shelf.id, shelf.name)}
                                                                    className="text-[#e22420] hover:bg-red-50 p-1 rounded text-xs font-semibold"
                                                                >
                                                                    Confirm
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteConfirm(null)}
                                                                    className="text-[#5d5d5d] hover:bg-gray-50 p-1 rounded text-xs"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-[#5d5d5d]">Current Parcels</span>
                                                    <Badge
                                                        className={
                                                            shelf.parcelCount > 0
                                                                ? "bg-blue-100 text-blue-800"
                                                                : "bg-gray-100 text-gray-800"
                                                        }
                                                    >
                                                        {shelf.parcelCount}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-[#5d5d5d]">Created</span>
                                                    <span className="text-xs text-neutral-700">
                                                        {new Date(shelf.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {!canDelete && shelf.parcelCount > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-[#d1d1d1]">
                                                        <div className="flex items-center gap-2 text-xs text-orange-600">
                                                            <AlertCircleIcon className="w-4 h-4" />
                                                            <span>Contains {shelf.parcelCount} parcel(s)</span>
                                                        </div>
                                                    </div>
                                                )}
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
