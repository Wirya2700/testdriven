# import fnmatch
# import os
#
# # config
# SOURCES = [
#     './src/_posts/course/01',
#     './src/_posts/course/02',
#     './src/_posts/course/03'
# ]
#
#
# def get_files(folders):
#     num = 1
#     for folder in folders:
#         for file in os.listdir(folder):
#             if len(str(num)) == 1:
#                 num = '0' + str(num)
#             new_file_name = f'2017-01-{num}-{file}'
#             print(new_file_name)
#             num = int(num) + 1
#             path = os.path.abspath(
#                 os.path.join('./src/_posts/course/', new_file_name))
#             with open(os.path.abspath(f'{folder}/{file}'), 'r') as original:
#                 data = original.read()
#             with open(path, 'w') as modified:
#                 modified.write(data)
#
#
# if __name__ == '__main__':
#     get_files(SOURCES)
