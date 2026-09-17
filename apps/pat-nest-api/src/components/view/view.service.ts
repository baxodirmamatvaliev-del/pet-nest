import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { View } from '../../libs/dto/view/view';

@Injectable()
export class ViewService {
  constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

  public async recordView(input: Pick<View, 'memberId' | 'viewRefId' | 'viewGroup'>): Promise<View | null> {
    const viewExist = await this.viewModel.findOne(input).exec();
    if (viewExist) return null;

    try {
      return await this.viewModel.create(input);
    } catch (err) {
      // Bir vaqtda takroriy so‘rov kelsa, ko‘rish ikkinchi marta hisoblanmaydi.
      if (err.code === 11000) return null;
      throw err;
    }
  }
}
