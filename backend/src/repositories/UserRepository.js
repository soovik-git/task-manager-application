import User from '../models/User.js';

class UserRepository {
  async createUser(userData) {
    return await User.create(userData);
  }

  async findByEmail(email) {
    // Select password because we set it to select: false in schema by default
    return await User.findOne({ email }).select('+password');
  }

  async findById(id) {
    return await User.findById(id);
  }
}

export default new UserRepository();
