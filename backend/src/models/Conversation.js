const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    lastMessage: {
      text: String,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      createdAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure index for quickly finding user conversations
conversationSchema.index({ participants: 1 });
conversationSchema.index({ product: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
