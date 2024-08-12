'use client';
import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import { UnitEditDefaultValue } from '@/backend/defaultData/unit';
import { SearchTask, DeleteTask } from '@/backend/feature/task';
import { EditUnit, ResetError, DeleteUnit } from '@/backend/feature/unit';
import { IUnitError } from '@/backend/models/messages/IUnitMessage';
import FormikShowError from '@/components/ErrorMessage/formikForm';
import BottomFormError from '@/components/ErrorMessage/bottomForm';
import SchemaUnit from '@/backend/validationSchema/unit/unitSchema';
import ITask from '@/backend/models/data/ITask';
import IUnit from '@/backend/models/data/IUnit';

//Form
import AddTaskForm from './addTaskForm';
import EditTaskForm from './editTaskForm';
import OverlapForm from '@/components/Form/overlapForm';
import DeleteForm from '@/components/Form/deleteModal';
//Button
import SubmitButton from '@/components/Button/submitButton';
import DetailButton from '@/components/Button/detailButton';
import BackContentButton from '@/components/Button/backContentButton';
import DeleteButton from '@/components/Button/deleteButton';
import AddButton from '@/components/Button/addButton';
import SearchBar from '@/components/Field/searchBar';
import EditButton from '@/components/Button/editButton';

const DefaultErrorMessage: IUnitError = {
  status: false,
  courseIDError: null,
  unitNoError: null,
  systemError: null,
};

interface TaskProperties {
  courseID: string;
  unitID: string;
}

interface TaskFormProps {
  courseID: string;
  unitID: string;
  taskID: string;
  data: ITask;
}

const UnitDetail: React.FC<{
  courseID: string;
  unitID: string;
  unitInfo: IUnit;
  taskList: ITask[];
}> = ({ courseID, unitID, unitInfo, taskList }) => {
  const [error, setError] = useState(DefaultErrorMessage);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalHeader, setModalHeader] = useState('Thêm bài');
  const [currentForm, setCurrentForm] = useState<React.FC>(() => AddTaskForm);
  const [search, setSearch] = useState<string>('');
  const [searchTask, setSearchTask] = useState(taskList);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteFunction, setDeleteFunction] = useState<() => Promise<void>>(
    () => async () => {},
  );

  //Tìm kiếm
  useEffect(() => {
    setSearchTask(SearchTask(search, taskList));
  }, [search, taskList]);

  // Add Unit Form
  const handleOpenAddModal = (FormComponent: React.FC<TaskProperties>) => {
    const WrappedFormComponent = () => (
      <FormComponent courseID={courseID} unitID={unitID} />
    );
    setCurrentForm(() => WrappedFormComponent);
    setIsModalOpen(true);
    setModalHeader('Thêm danh mục');
  };

  //Edit Task Form
  const handleOpenEditModal = (
    FormComponent: React.FC<TaskFormProps>,
    taskID: string,
    contentData,
  ) => {
    setCurrentForm(() => (
      <FormComponent
        courseID={courseID}
        unitID={unitID}
        taskID={taskID}
        data={contentData}
      />
    ));
    setIsModalOpen(true);
    setModalHeader('Chỉnh sửa nội dung bài học');
  };

  //Delete Form
  const handleDelete = (func: () => Promise<void>) => {
    setIsDeleteModalOpen(true);
    setDeleteFunction(() => func);
  };

  return (
    <section className="antialiase overflow-y-auto px-4 lg:px-8">
      <BackContentButton url={`/admin/course/${courseID}`} />

      <div className="my-3 flex items-start justify-between">
        <div>
          <h2
            id="header"
            className="font-manrope text-2xl font-bold text-black dark:text-white"
          >
            Chi tiết bài học
          </h2>
          <h1 id="createAt" className="text-black dark:text-white">
            Ngày tạo: {`${unitInfo.unitUploadDate ?? 'Không xác định'}`}
          </h1>

          <h1 id="lastEdit" className="text-black dark:text-white">
            Chỉnh lần cuối:{' '}
            {`${unitInfo.unitLastEditDate ?? 'Chưa thực hiện chỉnh sửa'}`}
          </h1>
        </div>

        <div>
          <h1 id="courseID" className="text-black dark:text-white">
            Mã khóa học: {courseID}
          </h1>
          <h1 id="unitID" className="text-black dark:text-white">
            Mã bài học: {unitID}
          </h1>
        </div>
      </div>

      <div>
        <Formik
          initialValues={UnitEditDefaultValue(unitInfo)}
          validationSchema={SchemaUnit}
          onSubmit={(editData) =>
            EditUnit(courseID, unitID, editData, unitInfo, setError)
          }
        >
          {({ setFieldValue }) => (
            <Form>
              <div className="flex gap-4">
                <div id="unitName_Add" className="w-full">
                  <label
                    htmlFor="unitName_AddInput"
                    className="text-gray-900 mb-2 block text-sm font-medium dark:text-white"
                  >
                    Tên bài học
                  </label>

                  <Field
                    id="unitName_AddInput"
                    name="unitName"
                    type="text"
                    placeholder="Điền tên bài học..."
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      ResetError(event, setFieldValue, setError)
                    }
                    className="text-gray-900 dark:placeholder-gray-400 mb-2 block w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm focus:border-blue-600 focus:ring-lime-600 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-lime-500"
                  />
                  <FormikShowError
                    type={'Add'}
                    filedName={'unitName'}
                    errorMessage={null}
                  />
                </div>
              </div>

              <div id="unitDescription_Add">
                <label
                  htmlFor="unitDescription_AddInput"
                  className="text-gray-900 mb-2 mt-3 block text-sm font-medium dark:text-white"
                >
                  Mô tả
                </label>

                <Field
                  id="unitDescription_AddInput"
                  name="unitDescription"
                  type="text"
                  placeholder="Điền vào mô tả..."
                  className="text-gray-900 focus:ring-primary-600 focus:border-primary-600 dark:placeholder-gray-400 dark:focus:ring-primary-500 dark:focus:border-primary-500 mb-2 block w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
                <FormikShowError
                  type={'Add'}
                  filedName={'unitDescription'}
                  errorMessage={null}
                />
              </div>

              <BottomFormError type={'Add'} errorMessage={error.systemError} />
              <div className="flex justify-end space-x-4">
                <SubmitButton buttonName="Cập nhật" />
                <DeleteButton
                  onClick={() =>
                    handleDelete(() =>
                      DeleteUnit(courseID, unitID, false, setError),
                    )
                  }
                />
              </div>
            </Form>
          )}
        </Formik>
      </div>

      <div className="mt-5">
        <div>
          <h2
            id="header"
            className="font-manrope my-3 text-2xl font-bold text-black dark:text-white"
          >
            Danh mục bài học
          </h2>
        </div>

        <div className="x mt-3 grid grid-cols-1 gap-4 sm:mb-5 min-[890px]:grid-cols-2">
          <SearchBar onChange={(e) => setSearch(e.target.value)} />

          <div className="flex flex-col gap-2.5 min-[890px]:flex-row ">
            <AddButton
              onClick={() => handleOpenAddModal(AddTaskForm)}
              buttonName="Thêm danh mục"
            />
          </div>
        </div>

        <div className="flex max-h-[65vh] flex-col overflow-auto">
          <table id="table" className="w-full">
            <thead className="text-gray-400 sticky top-0 bg-slate-200 text-left text-xs uppercase dark:bg-slate-700 dark:text-white">
              <tr>
                <th id="idHead" className="w-[5rem] text-center">
                  STT
                </th>
                <th id="nameHead" className="px-4 py-3">
                  Tên danh mục
                </th>
                <th id="createAtHead" className="w-[12rem] px-4 py-3">
                  Ngày tạo
                </th>
                <th id="LastUpdateHead" className="w-[12rem] px-4 py-3">
                  Chỉnh sửa lần cuối
                </th>
                <th id="managerOptionHead" className="w-[20rem] px-4 py-3"></th>
              </tr>
            </thead>

            {searchTask.length == 0 ? (
              <tbody>
                <tr>
                  <td colSpan={5}>
                    <p className="my-4 flex w-full justify-center text-lg font-bold">
                      Không có nội dung nào
                    </p>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="h-[50px] items-center divide-y">
                {searchTask
                  .sort((a, b) => a.taskNo - b.taskNo)
                  .map((data) => (
                    <tr
                      key={data.taskNo}
                      className="dark:border-gray-700 border-b border-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
                    >
                      <td id="taskID" className="w-[5rem] text-center">
                        {data.taskNo}
                      </td>

                      <td id="name" className="px-4">
                        {`${data.taskName}`}
                      </td>

                      <td id="createAt" className="px-4">
                        {`${data.taskUploadDate}`}
                      </td>

                      <td id="editAt" className="px-4">
                        {!data.taskLastEditDate
                          ? 'Chưa chỉnh sửa'
                          : `${data.taskLastEditDate}`}
                      </td>
                      <td id="managerOption">
                        <div className="flex items-center justify-end px-4 py-3">
                          <EditButton
                            onClick={() =>
                              handleOpenEditModal(
                                EditTaskForm,
                                data.taskID ?? '',
                                data,
                              )
                            }
                          />
                          <DetailButton
                            link={`/admin/course/${courseID}/unit/${unitID}/task/${data.taskID}`}
                            buttonName="Chi tiết"
                          />
                          <div className="ml-4">
                            <DeleteButton
                              onClick={() =>
                                handleDelete(() =>
                                  DeleteTask(
                                    courseID,
                                    unitID,
                                    data.taskID ?? '',
                                    true,
                                  ),
                                )
                              }
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            )}
          </table>
        </div>
      </div>

      {DeleteForm(
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        async () => await deleteFunction(),
      )}
      {OverlapForm(isModalOpen, setIsModalOpen, currentForm, modalHeader)}
    </section>
  );
};

export default UnitDetail;
