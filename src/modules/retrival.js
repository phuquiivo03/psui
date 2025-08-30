import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

// Khởi tạo client
const suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });

// Thay bằng địa chỉ ví người dùng và ID của PostMetaData
const userAddress = '0xb4082d2f32c4ae5ac774cb266d7ffa5d80488fa257c40023e4ec5e4980e121bb';      // ví người dùng
const postMetaId = '0xaa613be238a1d29aecd4a2c48e3f7dd948eba8723dbf5a336da61588eaaeb6df';       // ID của PostMetaData object

async function checkVoteStatus(userAddress, postMetaId) {
  try {
    // Bước 1: Lấy User object ID (user_id)
    const owned = await suiClient.getOwnedObjects({
      owner: userAddress,
      filter: {
        StructType: '0xafa3e6b3070c5c5683ea78ca5529758dbf46ddeaca8d4045c6185c48577361ab::userLib::User',
      },
      options: {
        showType: true,
      },
    });

    if (!owned.data.length) {
      console.log('User object not found for this address.');
      return;
    }

    const userObjectId = owned.data[0].data.objectId;
    console.log('✅ Found user ID:', userObjectId);

    // Bước 2: Lấy PostMetaData object
    const postMetaData = await suiClient.getObject({
      id: postMetaId,
      options: {
        showContent: true,
      },
    });

    
    const content = postMetaData.data?.content;
    console.log(content.fields.comments)
    if (!content || content.dataType !== 'moveObject') {
      console.error('PostMetaData object not found or invalid.');
      return;
    }
    const historyVotes = content.fields.historyVotes.fields.contents;

    // Bước 3: Tìm user_id trong historyVotes
    const voteEntry = historyVotes.find((entry) => entry.fields.key === userObjectId);

    if (!voteEntry) {
      console.log('❌ Chưa từng vote post này.');
      return;
    }

    const voteCode = Number(voteEntry.value);
    if (voteCode === 3) {
      console.log('👍 Bạn đang upvote post này.');
    } else if (voteCode === 1) {
      console.log('👎 Bạn đang downvote post này.');
    } else if (voteCode === 2) {
      console.log('⚪️ Bạn đã huỷ vote (neutral).');
    } else {
      console.log('❓ Vote code không xác định:', voteCode);
    }
  } catch (err) {
    console.error('Lỗi khi kiểm tra vote:', err);
  }
}

async function checkFullReplyVote({
    voterAddress,
    replyMetaId,
    replyId,
    authorAddressB,
    postIdC
  }) {
    try {
      // 1. Tìm User object ID của voter A
      const owned = await suiClient.getOwnedObjects({
        owner: voterAddress,
        filter: { StructType: '0xafa3e6b3070c5c5683ea78ca5529758dbf46ddeaca8d4045c6185c48577361ab::userLib::User' },
        options: { showType: true },
      });
  
      if (!owned.data.length) return 'not_voted';
  
      const voterUserId = owned.data[0].data.objectId;
  
      // 2. Tìm User object ID của author B
      const authorOwned = await suiClient.getOwnedObjects({
        owner: authorAddressB,
        filter: { StructType: '0xafa3e6b3070c5c5683ea78ca5529758dbf46ddeaca8d4045c6185c48577361ab::userLib::User' },
        options: { showType: true },
      });
  
      if (!authorOwned.data.length) return 'invalid_author';
  
      const authorUserId = authorOwned.data[0].data.objectId;
  
      // 3. Lấy thông tin Reply object
      const replyRes = await suiClient.getObject({
        id: replyId,
        options: { showContent: true },
      });
  
      const replyFields = replyRes.data?.content?.fields;
      if (!replyFields) return 'error';
  
      // 3.1 Kiểm tra đúng author không
      if (replyFields.author !== authorUserId) {
        return 'invalid_author';
      }
  
      // 3.2 Kiểm tra đúng post cha không
      if (replyFields.parent_id !== postIdC) {
        return 'invalid_post';
      }
  
      // 4. Lấy ReplyMetaData object
      const metaRes = await suiClient.getObject({
        id: replyMetaId,
        options: { showContent: true },
      });
  
      const historyVotes = metaRes.data?.content?.fields?.historyVotes?.fields?.contents || [];
  
      const voteEntry = historyVotes.find(entry => entry.key === voterUserId);
  
      if (!voteEntry) return 'not_voted';
  
      const voteCode = Number(voteEntry.value);
      if (voteCode === 3) return 'valid_upvoted';
      if (voteCode === 1) return 'valid_downvoted';
      if (voteCode === 2) return 'valid_neutral';
  
      return 'error';
    } catch (err) {
      console.error('Lỗi kiểm tra vote reply đầy đủ:', err);
      return 'error';
    }
  }
  
  // ▶️ Ví dụ sử dụng:
  // checkFullReplyVote({
  //   voterAddress: '0xb4082d2f32c4ae5ac774cb266d7ffa5d80488fa257c40023e4ec5e4980e121bb',        // A
  //   replyMetaId: '0xaa613be238a1d29aecd4a2c48e3f7dd948eba8723dbf5a336da61588eaaeb6df',      // metadata của reply R
  //   replyId: '0xREPLY...',         // object của reply R
  //   authorAddressB: '0xB...',      // B
  //   postIdC: '0xPOST...'           // C
  // }).then(console.log);

// checkVoteStatus(userAddress, postMetaId);

async function checkReply(voterAddress) {
  const replies = await suiClient.getOwnedObjects({
    owner: voterAddress, // address A
    filter: {
      StructType: '0xafa3e6b3070c5c5683ea78ca5529758dbf46ddeaca8d4045c6185c48577361ab::postLib::ReplyMetaData',
    },
    options: { showContent: true },
  });
  console.log('-----')
  console.log(replies.data)
  console.log('-----')

  replies.data.forEach((reply) => {
    const replyFields = reply.data?.content
    if (!replyFields) return;

    console.log('content field \n', replyFields);
  });
}

checkReply('0x64cdfc589e713a633c2c7add0360c141b62af7eb32dff8e391724cacb0b8e1af')
