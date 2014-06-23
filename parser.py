#! /usr/bin/env python3

from bs4 import BeautifulSoup
import bs4
import itertools as it
import sys


def still_going(tag):
    if type(tag) is bs4.element.NavigableString:
        return True
    try:
        if 'This layout table is used to present the sections found' in tag['summary']:
            return False
    except KeyError:
        return True
    return True


def get_prereq(tag):
    prereq = []
    while still_going(tag.next_sibling):
        tag = tag.next_sibling
        if tag.name == 'a':
            prereq.append(tag.string)
    return prereq

    
def main(file_name):
    soup = BeautifulSoup(open(file_name))
    body = soup.body
    course_div = body.find_all(attrs={'class':'pagebodydiv'})[0]
    courses = course_div.find_all(
        attrs={'summary':
               'This layout table is used to present the sections found'})
    nodes = []
    for course in courses[:-1]:
        values = course.tbody.tr.th.string.strip().split(' - ')
        if len(values) == 5:
            values = [values[0] + ' - ' + values[1]] + values [2:]
        name = values[0]
        course_id = values[1]
        course_code = values[2]
        course_section = values[3]
        while still_going(course.next_sibling):
            course = course.next_sibling
            if course.string and 'Prerequisites:' in course.string:
                break
        prereq = []
        if course.string and 'Prerequisites: ' in course.string:
            prereq = get_prereq(course)
            #print('prereq', prereq)
        nodes.append((course_code, prereq))
    
    out_file = open('dependancies.csv', 'w')
    for code, dep in nodes:
        csv = ','.join([code] + dep)
        print(csv, file=out_file)

if __name__ == '__main__':
    main(sys.argv[1])
