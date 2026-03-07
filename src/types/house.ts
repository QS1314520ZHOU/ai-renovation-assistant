export type RenovationPurpose = 'self_use' | 'rental' | 'wedding' | 'improvement';
export type HouseType = 'new_blank' | 'old_renovation';
export type TierLevel = 'economy' | 'standard' | 'premium';
export type FloorPreference = 'tile' | 'wood' | 'mixed';
export type RoomType = 'living_room' | 'master_bedroom' | 'bedroom' | 'kitchen' | 'bathroom' | 'balcony' | 'dining_room' | 'hallway';

export interface HouseProfile {
    id: string;
    projectName: string;
    city: string;
    grossArea: number;
    innerArea: number;
    layout: string;
    bedroomCount: number;
    livingRoomCount: number;
    bathroomCount: number;
    kitchenCount: number;
    balconyCount: number;
    floorHeight: number;
    houseType: HouseType;
    purpose: RenovationPurpose;
    targetBudget: number;
    targetStartDate?: string;
    targetMoveInDate?: string;
    familyMembers: {
        hasElderly: boolean;
        hasChildren: boolean;
        hasPets: boolean;
    };
    tierLevel: TierLevel;
    floorPreference: FloorPreference;
    hasCeiling: boolean;
    hasCustomCabinet: boolean;
    includeFurniture: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface RoomDimension {
    id: string;
    roomType: RoomType;
    roomName: string;
    length: number;
    width: number;
    height: number;
    doorWindowArea: number;
    floorArea: number;
    wallArea: number;
    ceilingArea: number;
}
