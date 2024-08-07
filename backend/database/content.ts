import {
  doc,
  updateDoc,
  getDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/backend/database/firebase';
import { TableName } from '@/backend/globalVariable';
import {
  AddDatabaseWithoutID,
  GenerateID,
} from '@/backend/database/generalFeature';
import { ICalculateTwoNumbersContent } from '@/backend/models/data/Content/ICalculateTwoNumbers';
import { ICardContent } from '@/backend/models/data/Content/ICard';
import { IFlashcardContent } from '@/backend/models/data/Content/IFlashcard';
import IContent from '@/backend/models/data/Content/IContent';
import { DeleteDocument } from '@/backend/database/generalFeature';
import ContentMessage from '@/backend/messages/contentMessage';
import { FormatISODate } from '@/backend/database/generalFeature';
import { ContentType } from '@/backend/globalVariable';
//Thêm nội dung học
export async function AddContent(
  courseID: string,
  unitID: string,
  taskID: string,
  contentID: string,
  data: IContent,
): Promise<boolean> {
  const baseURL = `${TableName.COURSE}/${courseID}/${TableName.UNIT}/${unitID}/${TableName.TASK}/${taskID}/${TableName.CONTENT}`;

  //Có contentID ==> Dữ liệu cũ
  if (contentID && data.contentData != null) {
    try {
      const document = doc(db, baseURL, contentID);
      const documentData = await getDoc(document);
      if (documentData.exists()) {
        const contents = documentData.data().contentData;
        contents.push(data.contentData);

        await updateDoc(document, {
          contentData: contents,
          contentLastEditDate: new Date(),
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  //Không có contentID ==> Dữ liệu mới
  const id = await GenerateID(baseURL);
  const contentData = {
    contentNo: data.contentNo,
    contentType: data.contentType.toUpperCase(),
    contentName: data.contentName,
    contentDescription: data.contentDescription,
    contentData: data.contentData == null ? [] : [data.contentData],
    contentCreateAt: new Date(),
    contentLastEditDate: null,
  };
  return await AddDatabaseWithoutID(`${baseURL}/${id}`, contentData);
}

//Xóa nội dung bài học
export async function DeleteContent(
  courseID: string,
  unitID: string,
  taskID: string,
  contentID: string,
  position: string,
) {
  const baseURL = `${TableName.COURSE}/${courseID}/${TableName.UNIT}/${unitID}/${TableName.TASK}/${taskID}/${TableName.CONTENT}`;
  //Có liệt kê vị trí => Xóa dữ liệu bên trong
  if (position) {
    const document = doc(db, baseURL, contentID);
    const documentData = await getDoc(document);

    if (documentData.exists()) {
      let contents = documentData.data().contentData;
      contents = contents.filter((question) => question.position != position);
      await updateDoc(document, {
        contentData: contents,
        contentLastEditDate: new Date(),
      });
    }
  }

  //Không liệt kê vị trí => Xóa content
  await DeleteDocument(baseURL, contentID);
}

//Sửa nội dung bài học
export async function EditContent(
  courseID: string,
  unitID: string,
  taskID: string,
  contentID: string,
  data: IContent,
  originalPosition: number,
) {
  const baseURL = `${TableName.COURSE}/${courseID}/${TableName.UNIT}/${unitID}/${TableName.TASK}/${taskID}/${TableName.CONTENT}`;
  const document = doc(db, baseURL, contentID);

  //Bản chỉnh sửa ban đầu
  const originalDocumentData = await getDoc(document);
  if (!originalDocumentData.exists()) {
    return false;
  }

  //Có chỉnh sửa Content Data
  let editContent = originalDocumentData.data().contentData;
  if (data.contentData) {
    editContent = editContent.map((original) => {
      if (original.position == originalPosition) {
        return data.contentData;
      }
      return original;
    });
  }

  //Tiến hành cập nhật
  try {
    await updateDoc(document, {
      contentType: originalDocumentData.data().contentType,
      contentName: data.contentName,
      contentDescription: data.contentDescription,
      contentNo: data.contentNo,
      contentData: editContent,
      contentCreateAt: originalDocumentData.data().contentCreateAt,
      contentLastEditDate: new Date(),
    });
    return true;
  } catch (e) {
    return false;
  }
}

//Lấy danh sách nội dung
export async function GetContent(
  courseID: string,
  unitID: string,
  taskID: string,
  contentID: string,
) {
  const baseURL = `${TableName.COURSE}/${courseID}/${TableName.UNIT}/${unitID}/${TableName.TASK}/${taskID}/${TableName.CONTENT}/`;
  try {
    if (contentID) {
      const document = doc(db, baseURL, contentID);
      const documentData = await getDoc(document);
      if (!documentData.exists()) {
        return null;
      }
      return await ContentData(documentData);
    }
    const contentCollection = collection(db, baseURL);
    const contentDocuments = await getDocs(contentCollection);
    const contentList = await Promise.all(
      contentDocuments.docs.map(async (doc) => await ContentData(doc)),
    );

    if (contentList.length === 0) {
      return null;
    }
    return contentList;
  } catch {
    return ContentMessage.SYSTEM_ERROR;
  }
}

//Kiểm tra và đề xuất vị trí cho position trong contentData
export async function SuggestCheckAddPosition(
  courseID: string,
  unitID: string,
  taskID: string,
  contentID: string,
  positionNo: number,
): Promise<number> {
  //Kiểm tra có số âm không
  if (!isNaN(positionNo) && positionNo < 1) {
    return NaN;
  }
  //Lấy danh sách nội dung
  const pathName = `${TableName.COURSE}/${courseID}/${TableName.UNIT}/${unitID}/${TableName.TASK}/${taskID}/${TableName.CONTENT}`;
  const document = doc(db, pathName, contentID);
  const documentData = await getDoc(document);

  //Có dữ liệu trong danh sách
  if (documentData.exists()) {
    const dataList:
      | ICalculateTwoNumbersContent[]
      | ICardContent[]
      | IFlashcardContent[] = documentData.data().contentData;

    //Không có số => Đề xuất số
    if (isNaN(positionNo) || positionNo == null) {
      let suggestNo = 1;
      for (const data of dataList) {
        const previousNo = Number(data.position);
        if (!isNaN(previousNo) && previousNo >= suggestNo) {
          suggestNo = previousNo + 1;
        }
      }
      return suggestNo;
    }

    //Có số => Kiểm tra số hợp lệ
    for (const data of dataList) {
      const previousNo = Number(data.position);
      if (!isNaN(previousNo) && previousNo == positionNo) {
        return NaN;
      }
    }
    return positionNo;
  }

  //Không có dữ liệu => Trả về nguyên vẹn
  if (isNaN(positionNo)) {
    return 1;
  }
  return positionNo;
}

//Kiểu tra kiểu nội dung có khớp không
export async function CheckContentType(
  courseID: string,
  unitID: string,
  taskID: string,
  contentID: string,
  contentNo: number,
  contentType: string,
): Promise<boolean> {
  //Lấy danh sách nội dung
  const pathName = `${TableName.COURSE}/${courseID}/${TableName.UNIT}/${unitID}/${TableName.TASK}/${taskID}/${TableName.CONTENT}`;
  const document = doc(db, pathName, contentID);
  const documentData = await getDoc(document);

  //Kiểm tra kiểu loại
  if (documentData.exists()) {
    if (
      documentData.data().contentType.toUpperCase() ==
        contentType.toUpperCase() &&
      documentData.data().contentNo == contentNo
    ) {
      return true;
    }
  }

  return false;
}

//Kiểm tra đổi thứ tự nội dung
export async function CheckPositionEdit(
  courseID: string,
  unitID: string,
  taskID: string,
  contentID: string,
  previousPosition: number,
  position: number,
): Promise<number> {
  //Lấy danh sách nội dung
  const pathName = `${TableName.COURSE}/${courseID}/${TableName.UNIT}/${unitID}/${TableName.TASK}/${taskID}/${TableName.CONTENT}`;
  const document = doc(db, pathName, contentID);
  const documentData = await getDoc(document);

  //Lấy được danh sách
  if (documentData.exists()) {
    const dataList:
      | ICalculateTwoNumbersContent[]
      | ICardContent[]
      | IFlashcardContent[] = documentData.data().contentData;

    //Nếu số bị null
    if (isNaN(position)) {
      return previousPosition;
    }

    //Kiểm tra số có hợp lệ không
    for (const data of dataList) {
      const currentNo = Number(data.position);
      if (
        !isNaN(currentNo) &&
        currentNo === position &&
        currentNo != previousPosition
      ) {
        return NaN;
      }
    }
    return position;
  }
  return NaN;
}

export async function CheckEditPositionExist(
  courseID: string,
  unitID: string,
  taskID: string,
  contentID: string,
  contentType: string,
  position: number,
): Promise<boolean> {
  //Lấy danh sách nội dung
  const pathName = `${TableName.COURSE}/${courseID}/${TableName.UNIT}/${unitID}/${TableName.TASK}/${taskID}/${TableName.CONTENT}`;
  const document = doc(db, pathName, contentID);
  const documentData = await getDoc(document);
  //Lấy được danh sách
  if (documentData.exists()) {
    if (contentType != documentData.data().contentType) {
      return false;
    }

    const dataList:
      | ICalculateTwoNumbersContent[]
      | ICardContent[]
      | IFlashcardContent[] = documentData.data().contentData;

    //Kiểm tra vị trí cũ có tồn tại không
    for (const data of dataList) {
      const currentNo = Number(data.position);
      if (currentNo == position) {
        return true;
      }
    }
    return false;
  }
  return false;
}

//Format danh sách
async function ContentData(doc) {
  return {
    contentID: doc.id,
    contentType: doc.data().contentType,
    contentNo: doc.data().contentNo,
    contentName: doc.data().contentName,
    contentDescription: doc.data().contentDescription,
    contentCreateAt: FormatISODate(
      doc.data().contentCreateAt.toDate().toISOString(),
    ),
    contentLastEditDate:
      doc.data().contentLastEditDate != null
        ? FormatISODate(doc.data().contentLastEditDate.toDate().toISOString())
        : null,
    contentData: ContentListData(
      doc.data().contentData,
      doc.data().contentType,
    ),
  };
}

function ContentListData(content, type: string) {
  let contentList;

  switch (type) {
    case ContentType.CALCULATE_TWO_NUMBER:
      contentList = content.map((item) => ({
        ...item,
        result: Calculation(item),
      }));
      break;
    default:
      contentList = content.map((data) => {
        return data;
      });
  }
  return contentList;
}

function Calculation(data) {
  const firstNumber = data.firstNumber;
  const secondNumber = data.secondNumber;
  switch (data.operator) {
    case '+':
      return firstNumber + secondNumber;
    case '-':
      return firstNumber - secondNumber;
    case '*':
      return firstNumber * secondNumber;
    case '/':
      return firstNumber / secondNumber;
    default:
      return NaN; // Xử lý cho các toán tử không xác định
  }
}
