import { Schema } from 'mongoose';
import { PetGender, PetListingType, PetLocation, PetStatus, PetType } from '../libs/enums/pet.enum';

const PetSchema = new Schema(
    {
        petType: {
            type: String,
            enum: PetType,
            required: true,
        },

        petListingType: {
            type: String,
            enum: PetListingType,
            required: true,
        },

        petStatus: {
            type: String,
            enum: PetStatus,
            default: PetStatus.ACTIVE,
        },

        petLocation: {
            type: String,
            enum: PetLocation,
            required: true,
        },

        petTitle: {
            type: String,
            required: true,
            trim: true,
        },

        petName: {
            type: String,
            required: true,
            trim: true,
        },

        petBreed: {
            type: String,
            trim: true,
        },

        petGender: {
            type: String,
            enum: PetGender,
            default: PetGender.UNKNOWN,
        },

        petAgeMonths: {
            type: Number,
            min: 0,
        },

        petPrice: {
            type: Number,
            default: 0,
            min: 0,
            validate: {
                validator(this: { petListingType: PetListingType }, value: number) {
                    return this.petListingType !== PetListingType.SALE || value > 0;
                },
                message: 'Sale listings require a positive price',
            },
        },

        petImages: {
            type: [String],
            default: [],
        },

        petDesc: {
            type: String,
        },

        petViews: {
            type: Number,
            default: 0,
            min: 0,
        },

        petLikes: {
            type: Number,
            default: 0,
            min: 0,
        },

        petComments: {
            type: Number,
            default: 0,
            min: 0,
        },

        petRank: {
            type: Number,
            default: 0,
        },

        memberId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Member',
        },

        completedAt: {
            type: Date,
        },

        deletedAt: {
            type: Date,
        },
    },
    { timestamps: true, collection: 'pets' },
);

PetSchema.index({ petStatus: 1, petType: 1, petLocation: 1, createdAt: -1 });
PetSchema.index({ memberId: 1, createdAt: -1 });

export default PetSchema;
